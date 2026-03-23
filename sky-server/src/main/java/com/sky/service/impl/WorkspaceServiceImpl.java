package com.sky.service.impl;

import com.sky.constant.StatusConstant;
import com.sky.entity.Orders;
import com.sky.mapper.DishMapper;
import com.sky.mapper.OrdersMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.mapper.UserMapper;
import com.sky.service.WorkspaceService;
import com.sky.vo.OrderStatisticsVO;
import com.sky.vo.WorkspaceOverviewVO;
import com.sky.vo.WorkspaceRealtimeVO;
import com.sky.websocket.AdminWebSocketServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class WorkspaceServiceImpl implements WorkspaceService {

    @Autowired
    private OrdersMapper ordersMapper;

    @Autowired
    private DishMapper dishMapper;

    @Autowired
    private SetmealMapper setmealMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public OrderStatisticsVO getOrderStatistics(LocalDateTime beginTime, LocalDateTime endTime) {
        return OrderStatisticsVO.builder()
                .totalOrders(safeCount(ordersMapper.countByCondition(null, null, beginTime, endTime)))
                .pendingPaymentOrders(safeCount(ordersMapper.countByCondition(Orders.PENDING_PAYMENT, null, beginTime, endTime)))
                .toBeConfirmedOrders(safeCount(ordersMapper.countByCondition(Orders.TO_BE_CONFIRMED, null, beginTime, endTime)))
                .confirmedOrders(safeCount(ordersMapper.countByCondition(Orders.CONFIRMED, null, beginTime, endTime)))
                .deliveryInProgressOrders(safeCount(ordersMapper.countByCondition(Orders.DELIVERY_IN_PROGRESS, null, beginTime, endTime)))
                .completedOrders(safeCount(ordersMapper.countByCondition(Orders.COMPLETED, null, beginTime, endTime)))
                .cancelledOrders(safeCount(ordersMapper.countByCondition(Orders.CANCELLED, null, beginTime, endTime)))
                .paidOrders(safeCount(ordersMapper.countByCondition(null, Orders.PAID, beginTime, endTime)))
                .unpaidOrders(safeCount(ordersMapper.countByCondition(null, Orders.UN_PAID, beginTime, endTime)))
                .turnover(safeAmount(ordersMapper.sumAmountByCondition(Orders.COMPLETED, Orders.PAID, beginTime, endTime)))
                .build();
    }

    @Override
    public WorkspaceOverviewVO getOverview() {
        OrderStatisticsVO orderStatistics = getOrderStatistics(null, null);
        return WorkspaceOverviewVO.builder()
                .dishTotal(safeCount(dishMapper.countByStatus(null)))
                .dishEnabled(safeCount(dishMapper.countByStatus(StatusConstant.ENABLE)))
                .setmealTotal(safeCount(setmealMapper.countByStatus(null)))
                .setmealEnabled(safeCount(setmealMapper.countByStatus(StatusConstant.ENABLE)))
                .totalOrders(orderStatistics.getTotalOrders())
                .toBeConfirmedOrders(orderStatistics.getToBeConfirmedOrders())
                .deliveryInProgressOrders(orderStatistics.getDeliveryInProgressOrders())
                .completedOrders(orderStatistics.getCompletedOrders())
                .turnover(orderStatistics.getTurnover())
                .build();
    }

    @Override
    public WorkspaceRealtimeVO getRealtime() {
        LocalDateTime beginTime = LocalDate.now().atStartOfDay();
        LocalDateTime endTime = LocalDateTime.now();
        OrderStatisticsVO todayStatistics = getOrderStatistics(beginTime, endTime);

        return WorkspaceRealtimeVO.builder()
                .websocketOnlineCount(AdminWebSocketServer.onlineCount())
                .pendingPaymentOrders(todayStatistics.getPendingPaymentOrders())
                .toBeConfirmedOrders(todayStatistics.getToBeConfirmedOrders())
                .deliveryInProgressOrders(todayStatistics.getDeliveryInProgressOrders())
                .todayOrders(todayStatistics.getTotalOrders())
                .todayTurnover(todayStatistics.getTurnover())
                .todayUsers(safeCount(userMapper.countByCreateTime(beginTime, endTime)))
                .todayCompletionRate(calculateCompletionRate(todayStatistics.getCompletedOrders(), todayStatistics.getTotalOrders()))
                .build();
    }

    private Integer safeCount(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal safeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private BigDecimal calculateCompletionRate(Integer completedOrders, Integer totalOrders) {
        if (completedOrders == null || totalOrders == null || totalOrders == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(completedOrders)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
    }
}
