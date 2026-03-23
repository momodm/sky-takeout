package com.sky.service;

import com.sky.dto.OrdersPageQueryDTO;
import com.sky.dto.OrdersSubmitDTO;
import com.sky.entity.Orders;
import com.sky.result.PageResult;
import com.sky.vo.OrderSubmitVO;
import com.sky.vo.OrderVO;

public interface OrderService {

    OrderSubmitVO submit(OrdersSubmitDTO ordersSubmitDTO);

    PageResult historyOrders(Integer page, Integer pageSize, Integer status);

    OrderVO orderDetail(Long id);

    void payment(Long id);

    void reminder(Long id);

    void cancelByUser(Long id);

    void repetition(Long id);

    PageResult conditionSearch(OrdersPageQueryDTO ordersPageQueryDTO);

    OrderVO adminOrderDetail(Long id);

    void confirm(Orders orders);

    void rejection(Orders orders);

    void cancel(Orders orders);

    void delivery(Long id);

    void complete(Long id);

    int cancelTimedOutOrders(java.time.LocalDateTime cutoffTime);
}
