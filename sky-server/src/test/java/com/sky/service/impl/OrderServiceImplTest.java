package com.sky.service.impl;

import com.sky.constant.MessageConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
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
import com.sky.service.OrderReminderService;
import com.sky.service.ShopService;
import com.sky.vo.OrderSubmitVO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrdersMapper ordersMapper;

    @Mock
    private OrderDetailMapper orderDetailMapper;

    @Mock
    private AddressBookMapper addressBookMapper;

    @Mock
    private ShoppingCartMapper shoppingCartMapper;

    @Mock
    private ShopService shopService;

    @Mock
    private OrderReminderService orderReminderService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @AfterEach
    void tearDown() {
        BaseContext.removeCurrentId();
    }

    @Test
    void submitShouldRejectWhenShopClosed() {
        BaseContext.setCurrentId(10L);
        when(shopService.getStatus()).thenReturn(StatusConstant.DISABLE);

        BaseException ex = assertThrows(BaseException.class, () -> orderService.submit(OrdersSubmitDTO.builder()
                .addressBookId(1L)
                .build()));

        assertEquals("店铺已打烊", ex.getMessage());
    }

    @Test
    void submitShouldCreateOrderAndClearCart() {
        BaseContext.setCurrentId(10L);
        when(shopService.getStatus()).thenReturn(StatusConstant.ENABLE);
        when(addressBookMapper.getByIdAndUserId(1L, 10L)).thenReturn(AddressBook.builder()
                .id(1L)
                .userId(10L)
                .consignee("张三")
                .phone("13800000000")
                .provinceName("北京")
                .cityName("北京")
                .districtName("东城")
                .detail("测试路 1 号")
                .build());
        when(shoppingCartMapper.listByUserId(10L)).thenReturn(Collections.singletonList(ShoppingCart.builder()
                .dishId(2L)
                .name("鱼香肉丝")
                .number(2)
                .amount(new BigDecimal("18.50"))
                .build()));
        doAnswer(invocation -> {
            Orders orders = invocation.getArgument(0);
            orders.setId(88L);
            return null;
        }).when(ordersMapper).insert(any(Orders.class));

        OrderSubmitVO orderSubmitVO = orderService.submit(OrdersSubmitDTO.builder()
                .addressBookId(1L)
                .packAmount(new BigDecimal("2.00"))
                .remark("少辣")
                .build());

        assertEquals(88L, orderSubmitVO.getId());
        assertEquals(new BigDecimal("39.00"), orderSubmitVO.getOrderAmount());
        assertNotNull(orderSubmitVO.getOrderNumber());

        ArgumentCaptor<List<OrderDetail>> detailCaptor = ArgumentCaptor.forClass(List.class);
        verify(orderDetailMapper).insertBatch(detailCaptor.capture());
        assertEquals(1, detailCaptor.getValue().size());
        assertEquals("鱼香肉丝", detailCaptor.getValue().get(0).getName());
        verify(shoppingCartMapper).deleteByUserId(10L);
    }

    @Test
    void orderDetailShouldRejectUnknownOrder() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(100L, 10L)).thenReturn(null);

        BaseException ex = assertThrows(BaseException.class, () -> orderService.orderDetail(100L));

        assertEquals(MessageConstant.ORDER_NOT_FOUND, ex.getMessage());
    }

    @Test
    void paymentShouldMarkOrderAsPaidAndNotifyAdmin() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(12L, 10L)).thenReturn(Orders.builder()
                .id(12L)
                .userId(10L)
                .number("202603211700000001")
                .status(Orders.PENDING_PAYMENT)
                .payStatus(Orders.UN_PAID)
                .build());

        orderService.payment(12L);

        ArgumentCaptor<Orders> captor = ArgumentCaptor.forClass(Orders.class);
        verify(ordersMapper).update(captor.capture());
        assertEquals(Orders.TO_BE_CONFIRMED, captor.getValue().getStatus());
        assertEquals(Orders.PAID, captor.getValue().getPayStatus());
        assertNotNull(captor.getValue().getCheckoutTime());
        verify(orderReminderService).notifyPaidOrder(any(Orders.class));
    }

    @Test
    void paymentShouldRejectRepeatedPayForPaidOrder() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(15L, 10L)).thenReturn(Orders.builder()
                .id(15L)
                .userId(10L)
                .status(Orders.TO_BE_CONFIRMED)
                .payStatus(Orders.PAID)
                .build());

        BaseException ex = assertThrows(BaseException.class, () -> orderService.payment(15L));

        assertEquals(MessageConstant.ORDER_ALREADY_PAID, ex.getMessage());
    }

    @Test
    void reminderShouldNotifyAdminWhenOrderCanBeUrged() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(18L, 10L)).thenReturn(Orders.builder()
                .id(18L)
                .userId(10L)
                .number("202603221230000001")
                .status(Orders.CONFIRMED)
                .build());

        orderService.reminder(18L);

        verify(orderReminderService).notifyReminder(any(Orders.class));
    }

    @Test
    void reminderShouldRejectPendingPaymentOrder() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(19L, 10L)).thenReturn(Orders.builder()
                .id(19L)
                .userId(10L)
                .status(Orders.PENDING_PAYMENT)
                .build());

        BaseException ex = assertThrows(BaseException.class, () -> orderService.reminder(19L));

        assertEquals(MessageConstant.ORDER_REMINDER_STATUS_ERROR, ex.getMessage());
    }

    @Test
    void cancelByUserShouldCancelPendingOrder() {
        BaseContext.setCurrentId(10L);
        when(ordersMapper.getByIdAndUserId(8L, 10L)).thenReturn(Orders.builder()
                .id(8L)
                .userId(10L)
                .status(Orders.PENDING_PAYMENT)
                .build());

        orderService.cancelByUser(8L);

        ArgumentCaptor<Orders> captor = ArgumentCaptor.forClass(Orders.class);
        verify(ordersMapper).update(captor.capture());
        assertEquals(Orders.CANCELLED, captor.getValue().getStatus());
        assertNotNull(captor.getValue().getCancelTime());
    }

    @Test
    void confirmShouldMoveOrderToConfirmed() {
        when(ordersMapper.getById(6L)).thenReturn(Orders.builder()
                .id(6L)
                .status(Orders.TO_BE_CONFIRMED)
                .build());

        orderService.confirm(Orders.builder().id(6L).build());

        ArgumentCaptor<Orders> captor = ArgumentCaptor.forClass(Orders.class);
        verify(ordersMapper).update(captor.capture());
        assertEquals(Orders.CONFIRMED, captor.getValue().getStatus());
    }

    @Test
    void completeShouldRequireDeliveryInProgress() {
        when(ordersMapper.getById(7L)).thenReturn(Orders.builder()
                .id(7L)
                .status(Orders.CONFIRMED)
                .build());

        BaseException ex = assertThrows(BaseException.class, () -> orderService.complete(7L));

        assertEquals(MessageConstant.ORDER_STATUS_ERROR, ex.getMessage());
    }

    @Test
    void cancelTimedOutOrdersShouldCancelPendingOrdersBeforeCutoff() {
        LocalDateTime cutoff = LocalDateTime.of(2026, 3, 22, 12, 0);
        when(ordersMapper.listTimedOutPendingOrders(eq(cutoff))).thenReturn(Arrays.asList(
                Orders.builder().id(21L).status(Orders.PENDING_PAYMENT).payStatus(Orders.UN_PAID).build(),
                Orders.builder().id(22L).status(Orders.PENDING_PAYMENT).payStatus(Orders.UN_PAID).build()
        ));

        int affected = orderService.cancelTimedOutOrders(cutoff);

        assertEquals(2, affected);
        ArgumentCaptor<Orders> captor = ArgumentCaptor.forClass(Orders.class);
        verify(ordersMapper, org.mockito.Mockito.times(2)).update(captor.capture());
        assertEquals(Orders.CANCELLED, captor.getAllValues().get(0).getStatus());
        assertEquals(MessageConstant.ORDER_TIMEOUT_CANCELLED, captor.getAllValues().get(0).getCancelReason());
        assertNotNull(captor.getAllValues().get(0).getCancelTime());
    }
}
