package com.sky.service.impl;

import com.sky.entity.Orders;
import com.sky.mapper.OrderDetailMapper;
import com.sky.mapper.OrdersMapper;
import com.sky.mapper.UserMapper;
import com.sky.vo.GoodsSalesVO;
import com.sky.vo.OrderReportVO;
import com.sky.vo.SalesTop10ReportVO;
import com.sky.vo.TurnoverReportVO;
import com.sky.vo.UserReportVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private OrdersMapper ordersMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private OrderDetailMapper orderDetailMapper;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void shouldBuildTurnoverUserAndOrderStatistics() {
        LocalDate begin = LocalDate.of(2026, 3, 24);
        LocalDate end = LocalDate.of(2026, 3, 25);

        when(ordersMapper.sumAmountByCondition(eq(Orders.COMPLETED), eq(Orders.PAID), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("88.50"), new BigDecimal("100.00"));
        when(userMapper.countByCreateTime(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(2, 3);
        when(userMapper.countTotalByCreateTime(any(LocalDateTime.class)))
                .thenReturn(10, 13);
        when(ordersMapper.countByCondition(eq(null), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(5, 7);
        when(ordersMapper.countByCondition(eq(Orders.COMPLETED), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(4, 6);

        TurnoverReportVO turnover = reportService.getTurnoverStatistics(begin, end);
        UserReportVO users = reportService.getUserStatistics(begin, end);
        OrderReportVO orders = reportService.getOrderStatistics(begin, end);

        assertEquals("2026-03-24,2026-03-25", turnover.getDateList());
        assertEquals("88.50,100.00", turnover.getTurnoverList());
        assertEquals("2,3", users.getNewUserList());
        assertEquals("10,13", users.getTotalUserList());
        assertEquals("5,7", orders.getOrderCountList());
        assertEquals("4,6", orders.getValidOrderCountList());
        assertEquals(12, orders.getTotalOrderCount());
        assertEquals(10, orders.getValidOrderCount());
        assertEquals(new BigDecimal("83.33"), orders.getOrderCompletionRate());
    }

    @Test
    void shouldBuildTop10AndExportWorkbook() {
        LocalDate today = LocalDate.now();

        when(orderDetailMapper.getSalesTop10(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(
                        GoodsSalesVO.builder().name("Kung Pao Chicken").number(12).build(),
                        GoodsSalesVO.builder().name("Cola Setmeal").number(8).build()
                ));
        when(ordersMapper.countByCondition(eq(null), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(9);
        when(ordersMapper.countByCondition(eq(Orders.COMPLETED), eq(null), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(6);
        when(ordersMapper.sumAmountByCondition(eq(Orders.COMPLETED), eq(Orders.PAID), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("180.00"));
        when(userMapper.countByCreateTime(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(5);

        SalesTop10ReportVO top10 = reportService.getSalesTop10(today, today);
        MockHttpServletResponse response = new MockHttpServletResponse();
        reportService.exportBusinessData(response);

        assertEquals("Kung Pao Chicken,Cola Setmeal", top10.getNameList());
        assertEquals("12,8", top10.getNumberList());
        assertTrue(response.getContentAsByteArray().length > 0);
        assertTrue(response.getContentType().startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }
}
