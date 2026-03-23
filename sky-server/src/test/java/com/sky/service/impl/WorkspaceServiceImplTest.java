package com.sky.service.impl;

import com.sky.constant.StatusConstant;
import com.sky.entity.Orders;
import com.sky.mapper.DishMapper;
import com.sky.mapper.OrdersMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.mapper.UserMapper;
import com.sky.vo.OrderStatisticsVO;
import com.sky.vo.WorkspaceOverviewVO;
import com.sky.vo.WorkspaceRealtimeVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceImplTest {

    @Mock
    private OrdersMapper ordersMapper;

    @Mock
    private DishMapper dishMapper;

    @Mock
    private SetmealMapper setmealMapper;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private WorkspaceServiceImpl workspaceService;

    @Test
    void getOrderStatisticsShouldAssembleCounts() {
        when(ordersMapper.countByCondition(null, null, null, null)).thenReturn(9);
        when(ordersMapper.countByCondition(Orders.PENDING_PAYMENT, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(Orders.TO_BE_CONFIRMED, null, null, null)).thenReturn(2);
        when(ordersMapper.countByCondition(Orders.CONFIRMED, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(Orders.DELIVERY_IN_PROGRESS, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(Orders.COMPLETED, null, null, null)).thenReturn(3);
        when(ordersMapper.countByCondition(Orders.CANCELLED, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(null, Orders.PAID, null, null)).thenReturn(5);
        when(ordersMapper.countByCondition(null, Orders.UN_PAID, null, null)).thenReturn(4);
        when(ordersMapper.sumAmountByCondition(Orders.COMPLETED, Orders.PAID, null, null)).thenReturn(new BigDecimal("128.50"));

        OrderStatisticsVO orderStatisticsVO = workspaceService.getOrderStatistics(null, null);

        assertEquals(9, orderStatisticsVO.getTotalOrders());
        assertEquals(2, orderStatisticsVO.getToBeConfirmedOrders());
        assertEquals(5, orderStatisticsVO.getPaidOrders());
        assertEquals(new BigDecimal("128.50"), orderStatisticsVO.getTurnover());
    }

    @Test
    void getOverviewShouldCombineCountsAndTurnover() {
        when(dishMapper.countByStatus(null)).thenReturn(7);
        when(dishMapper.countByStatus(StatusConstant.ENABLE)).thenReturn(5);
        when(setmealMapper.countByStatus(null)).thenReturn(4);
        when(setmealMapper.countByStatus(StatusConstant.ENABLE)).thenReturn(3);
        when(ordersMapper.countByCondition(null, null, null, null)).thenReturn(10);
        when(ordersMapper.countByCondition(Orders.PENDING_PAYMENT, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(Orders.TO_BE_CONFIRMED, null, null, null)).thenReturn(2);
        when(ordersMapper.countByCondition(Orders.CONFIRMED, null, null, null)).thenReturn(2);
        when(ordersMapper.countByCondition(Orders.DELIVERY_IN_PROGRESS, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(Orders.COMPLETED, null, null, null)).thenReturn(3);
        when(ordersMapper.countByCondition(Orders.CANCELLED, null, null, null)).thenReturn(1);
        when(ordersMapper.countByCondition(null, Orders.PAID, null, null)).thenReturn(6);
        when(ordersMapper.countByCondition(null, Orders.UN_PAID, null, null)).thenReturn(4);
        when(ordersMapper.sumAmountByCondition(Orders.COMPLETED, Orders.PAID, null, null)).thenReturn(new BigDecimal("88.00"));

        WorkspaceOverviewVO overview = workspaceService.getOverview();

        assertEquals(7, overview.getDishTotal());
        assertEquals(5, overview.getDishEnabled());
        assertEquals(4, overview.getSetmealTotal());
        assertEquals(3, overview.getSetmealEnabled());
        assertEquals(2, overview.getToBeConfirmedOrders());
        assertEquals(new BigDecimal("88.00"), overview.getTurnover());
    }

    @Test
    void getRealtimeShouldCombineTodayStatsAndOnlineCount() {
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(8);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.PENDING_PAYMENT), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(1);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.TO_BE_CONFIRMED), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(2);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.CONFIRMED), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(2);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.DELIVERY_IN_PROGRESS), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(1);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.COMPLETED), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(3);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.eq(Orders.CANCELLED), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(0);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.eq(Orders.PAID),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(5);
        when(ordersMapper.countByCondition(org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.eq(Orders.UN_PAID),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(3);
        when(ordersMapper.sumAmountByCondition(org.mockito.ArgumentMatchers.eq(Orders.COMPLETED), org.mockito.ArgumentMatchers.eq(Orders.PAID),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(new BigDecimal("168.88"));
        when(userMapper.countByCreateTime(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(4);

        WorkspaceRealtimeVO realtime = workspaceService.getRealtime();

        assertEquals(1, realtime.getPendingPaymentOrders());
        assertEquals(2, realtime.getToBeConfirmedOrders());
        assertEquals(1, realtime.getDeliveryInProgressOrders());
        assertEquals(8, realtime.getTodayOrders());
        assertEquals(4, realtime.getTodayUsers());
        assertEquals(new BigDecimal("168.88"), realtime.getTodayTurnover());
        assertEquals(new BigDecimal("37.50"), realtime.getTodayCompletionRate());
    }
}
