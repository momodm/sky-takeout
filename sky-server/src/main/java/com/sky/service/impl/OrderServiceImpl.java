package com.sky.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.sky.constant.MessageConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.OrdersPageQueryDTO;
import com.sky.dto.OrdersSubmitDTO;
import com.sky.entity.AddressBook;
import com.sky.entity.OrderDetail;
import com.sky.entity.Orders;
import com.sky.entity.ShoppingCart;
import com.sky.exception.BaseException;
import com.sky.mapper.AddressBookMapper;
import com.sky.mapper.OrderDetailMapper;
import com.sky.mapper.OrdersMapper;
import com.sky.mapper.ShoppingCartMapper;
import com.sky.result.PageResult;
import com.sky.service.OrderReminderService;
import com.sky.service.OrderService;
import com.sky.service.ShopService;
import com.sky.vo.OrderSubmitVO;
import com.sky.vo.OrderVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrdersMapper ordersMapper;

    @Autowired
    private OrderDetailMapper orderDetailMapper;

    @Autowired
    private AddressBookMapper addressBookMapper;

    @Autowired
    private ShoppingCartMapper shoppingCartMapper;

    @Autowired
    private ShopService shopService;

    @Autowired
    private OrderReminderService orderReminderService;

    @Override
    @Transactional
    public OrderSubmitVO submit(OrdersSubmitDTO ordersSubmitDTO) {
        // 下单前先完成营业状态、收货地址和购物车内容的基础校验。
        checkShopStatus();
        Long userId = getCurrentUserId();

        AddressBook addressBook = addressBookMapper.getByIdAndUserId(ordersSubmitDTO.getAddressBookId(), userId);
        if (addressBook == null) {
            throw new BaseException("收货地址不存在");
        }

        List<ShoppingCart> shoppingCartList = shoppingCartMapper.listByUserId(userId);
        if (shoppingCartList == null || shoppingCartList.isEmpty()) {
            throw new BaseException("购物车为空，不能下单");
        }

        BigDecimal orderAmount = calculateOrderAmount(shoppingCartList);
        BigDecimal packAmount = ordersSubmitDTO.getPackAmount() == null ? BigDecimal.ZERO : ordersSubmitDTO.getPackAmount();
        LocalDateTime orderTime = LocalDateTime.now();

        // 主订单记录保存用户、地址、金额与支付状态等聚合信息。
        Orders orders = Orders.builder()
                .number(generateOrderNumber())
                .status(Orders.PENDING_PAYMENT)
                .userId(userId)
                .addressBookId(addressBook.getId())
                .orderTime(orderTime)
                .payMethod(ordersSubmitDTO.getPayMethod() == null ? 1 : ordersSubmitDTO.getPayMethod())
                .payStatus(Orders.UN_PAID)
                .amount(orderAmount.add(packAmount))
                .remark(ordersSubmitDTO.getRemark())
                .phone(addressBook.getPhone())
                .address(buildFullAddress(addressBook))
                .consignee(addressBook.getConsignee())
                .estimatedDeliveryTime(ordersSubmitDTO.getEstimatedDeliveryTime())
                .packAmount(packAmount)
                .tablewareNumber(ordersSubmitDTO.getTablewareNumber())
                .build();
        ordersMapper.insert(orders);

        // 订单明细直接以购物车快照生成，避免后续商品改价影响历史订单。
        List<OrderDetail> orderDetails = new ArrayList<>();
        for (ShoppingCart shoppingCart : shoppingCartList) {
            orderDetails.add(OrderDetail.builder()
                    .orderId(orders.getId())
                    .name(shoppingCart.getName())
                    .image(shoppingCart.getImage())
                    .dishId(shoppingCart.getDishId())
                    .setmealId(shoppingCart.getSetmealId())
                    .dishFlavor(shoppingCart.getDishFlavor())
                    .number(shoppingCart.getNumber())
                    .amount(shoppingCart.getAmount())
                    .build());
        }
        orderDetailMapper.insertBatch(orderDetails);

        // 下单成功后立即清空购物车，保持用户侧状态一致。
        shoppingCartMapper.deleteByUserId(userId);

        return OrderSubmitVO.builder()
                .id(orders.getId())
                .orderNumber(orders.getNumber())
                .orderAmount(orders.getAmount())
                .orderTime(orderTime)
                .build();
    }

    @Override
    public PageResult historyOrders(Integer page, Integer pageSize, Integer status) {
        PageHelper.startPage(page, pageSize);
        Page<Orders> orderPage = ordersMapper.pageQuery(getCurrentUserId(), status);
        List<OrderVO> orderVOList = new ArrayList<>();
        for (Orders orders : orderPage.getResult()) {
            orderVOList.add(OrderVO.builder()
                    .orders(orders)
                    .orderDetails(orderDetailMapper.getByOrderId(orders.getId()))
                    .build());
        }
        return new PageResult(orderPage.getTotal(), orderVOList);
    }

    @Override
    public OrderVO orderDetail(Long id) {
        Orders orders = ordersMapper.getByIdAndUserId(id, getCurrentUserId());
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }
        return OrderVO.builder()
                .orders(orders)
                .orderDetails(orderDetailMapper.getByOrderId(id))
                .build();
    }

    @Override
    @Transactional
    public void payment(Long id) {
        Orders orders = ordersMapper.getByIdAndUserId(id, getCurrentUserId());
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }
        if (Orders.PAID.equals(orders.getPayStatus())) {
            throw new BaseException(MessageConstant.ORDER_ALREADY_PAID);
        }
        if (!Orders.PENDING_PAYMENT.equals(orders.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }

        // 支付成功后同步推进订单状态，并通知管理端出现新的待接单订单。
        ordersMapper.update(Orders.builder()
                .id(id)
                .status(Orders.TO_BE_CONFIRMED)
                .payStatus(Orders.PAID)
                .checkoutTime(LocalDateTime.now())
                .build());

        orderReminderService.notifyPaidOrder(Orders.builder()
                .id(id)
                .number(orders.getNumber())
                .status(Orders.TO_BE_CONFIRMED)
                .payStatus(Orders.PAID)
                .build());
    }

    @Override
    public void reminder(Long id) {
        Orders orders = ordersMapper.getByIdAndUserId(id, getCurrentUserId());
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }
        // 只有已支付待接单、已接单、派送中订单才允许继续催单。
        if (!canReminder(orders.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_REMINDER_STATUS_ERROR);
        }
        orderReminderService.notifyReminder(orders);
    }

    @Override
    @Transactional
    public void cancelByUser(Long id) {
        Orders orders = ordersMapper.getByIdAndUserId(id, getCurrentUserId());
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }
        if (!Orders.PENDING_PAYMENT.equals(orders.getStatus()) && !Orders.TO_BE_CONFIRMED.equals(orders.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }

        ordersMapper.update(Orders.builder()
                .id(id)
                .status(Orders.CANCELLED)
                .cancelReason("用户取消订单")
                .cancelTime(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional
    public void repetition(Long id) {
        Orders orders = ordersMapper.getByIdAndUserId(id, getCurrentUserId());
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }

        List<OrderDetail> orderDetails = orderDetailMapper.getByOrderId(id);
        if (orderDetails.isEmpty()) {
            throw new BaseException("订单明细为空");
        }

        Long userId = getCurrentUserId();
        for (OrderDetail orderDetail : orderDetails) {
            // 再来一单时按“同商品 + 同规格”合并数量，避免购物车重复堆叠。
            ShoppingCart query = ShoppingCart.builder()
                    .userId(userId)
                    .dishId(orderDetail.getDishId())
                    .setmealId(orderDetail.getSetmealId())
                    .dishFlavor(orderDetail.getDishFlavor())
                    .build();
            List<ShoppingCart> existingList = shoppingCartMapper.list(query);
            if (existingList.isEmpty()) {
                shoppingCartMapper.insert(ShoppingCart.builder()
                        .name(orderDetail.getName())
                        .image(orderDetail.getImage())
                        .userId(userId)
                        .dishId(orderDetail.getDishId())
                        .setmealId(orderDetail.getSetmealId())
                        .dishFlavor(orderDetail.getDishFlavor())
                        .number(orderDetail.getNumber())
                        .amount(orderDetail.getAmount())
                        .createTime(LocalDateTime.now())
                        .build());
            } else {
                ShoppingCart shoppingCart = existingList.get(0);
                shoppingCart.setNumber(shoppingCart.getNumber() + orderDetail.getNumber());
                shoppingCartMapper.updateNumberById(shoppingCart);
            }
        }
    }

    @Override
    public PageResult conditionSearch(OrdersPageQueryDTO ordersPageQueryDTO) {
        PageHelper.startPage(ordersPageQueryDTO.getPage(), ordersPageQueryDTO.getPageSize());
        Page<Orders> page = ordersMapper.pageQueryAdmin(ordersPageQueryDTO);
        return new PageResult(page.getTotal(), page.getResult());
    }

    @Override
    public OrderVO adminOrderDetail(Long id) {
        Orders orders = getExistingOrder(id);
        return OrderVO.builder()
                .orders(orders)
                .orderDetails(orderDetailMapper.getByOrderId(id))
                .build();
    }

    @Override
    public void confirm(Orders orders) {
        Orders existing = getExistingOrder(orders.getId());
        if (!Orders.TO_BE_CONFIRMED.equals(existing.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }
        ordersMapper.update(Orders.builder()
                .id(existing.getId())
                .status(Orders.CONFIRMED)
                .build());
    }

    @Override
    public void rejection(Orders orders) {
        Orders existing = getExistingOrder(orders.getId());
        if (Orders.CANCELLED.equals(existing.getStatus()) || Orders.COMPLETED.equals(existing.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }
        String reason = orders.getRejectionReason() == null ? "商家拒单" : orders.getRejectionReason();
        ordersMapper.update(Orders.builder()
                .id(existing.getId())
                .status(Orders.CANCELLED)
                .rejectionReason(reason)
                .cancelReason(reason)
                .cancelTime(LocalDateTime.now())
                .build());
    }

    @Override
    public void cancel(Orders orders) {
        Orders existing = getExistingOrder(orders.getId());
        if (Orders.CANCELLED.equals(existing.getStatus()) || Orders.COMPLETED.equals(existing.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }
        String reason = orders.getCancelReason() == null ? "商家取消订单" : orders.getCancelReason();
        ordersMapper.update(Orders.builder()
                .id(existing.getId())
                .status(Orders.CANCELLED)
                .cancelReason(reason)
                .cancelTime(LocalDateTime.now())
                .build());
    }

    @Override
    public void delivery(Long id) {
        Orders existing = getExistingOrder(id);
        if (!Orders.CONFIRMED.equals(existing.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }
        ordersMapper.update(Orders.builder()
                .id(id)
                .status(Orders.DELIVERY_IN_PROGRESS)
                .deliveryStatus(1)
                .build());
    }

    @Override
    public void complete(Long id) {
        Orders existing = getExistingOrder(id);
        if (!Orders.DELIVERY_IN_PROGRESS.equals(existing.getStatus())) {
            throw new BaseException(MessageConstant.ORDER_STATUS_ERROR);
        }
        ordersMapper.update(Orders.builder()
                .id(id)
                .status(Orders.COMPLETED)
                .deliveryStatus(2)
                .deliveryTime(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional
    public int cancelTimedOutOrders(LocalDateTime cutoffTime) {
        // 定时任务批量关闭超时未支付订单，避免待支付数据长期堆积。
        List<Orders> timedOutOrders = ordersMapper.listTimedOutPendingOrders(cutoffTime);
        int affected = 0;
        for (Orders timedOutOrder : timedOutOrders) {
            ordersMapper.update(Orders.builder()
                    .id(timedOutOrder.getId())
                    .status(Orders.CANCELLED)
                    .cancelReason(MessageConstant.ORDER_TIMEOUT_CANCELLED)
                    .cancelTime(LocalDateTime.now())
                    .build());
            affected++;
        }
        return affected;
    }

    private void checkShopStatus() {
        if (!StatusConstant.ENABLE.equals(shopService.getStatus())) {
            throw new BaseException("店铺已打烊");
        }
    }

    private Long getCurrentUserId() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new BaseException("用户未登录");
        }
        return userId;
    }

    private BigDecimal calculateOrderAmount(List<ShoppingCart> shoppingCartList) {
        BigDecimal total = BigDecimal.ZERO;
        for (ShoppingCart shoppingCart : shoppingCartList) {
            total = total.add(shoppingCart.getAmount().multiply(BigDecimal.valueOf(shoppingCart.getNumber())));
        }
        return total;
    }

    private String buildFullAddress(AddressBook addressBook) {
        StringBuilder builder = new StringBuilder();
        if (addressBook.getProvinceName() != null) {
            builder.append(addressBook.getProvinceName());
        }
        if (addressBook.getCityName() != null) {
            builder.append(addressBook.getCityName());
        }
        if (addressBook.getDistrictName() != null) {
            builder.append(addressBook.getDistrictName());
        }
        if (addressBook.getDetail() != null) {
            builder.append(addressBook.getDetail());
        }
        return builder.toString();
    }

    private String generateOrderNumber() {
        String prefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int suffix = ThreadLocalRandom.current().nextInt(1000, 10000);
        return prefix + suffix;
    }

    private Orders getExistingOrder(Long id) {
        Orders orders = ordersMapper.getById(id);
        if (orders == null) {
            throw new BaseException(MessageConstant.ORDER_NOT_FOUND);
        }
        return orders;
    }

    private boolean canReminder(Integer status) {
        return Orders.TO_BE_CONFIRMED.equals(status)
                || Orders.CONFIRMED.equals(status)
                || Orders.DELIVERY_IN_PROGRESS.equals(status);
    }
}
