package com.sky.service.impl;

import com.sky.entity.Orders;
import com.sky.exception.BaseException;
import com.sky.mapper.OrderDetailMapper;
import com.sky.mapper.OrdersMapper;
import com.sky.mapper.UserMapper;
import com.sky.service.ReportService;
import com.sky.vo.BusinessDataVO;
import com.sky.vo.GoodsSalesVO;
import com.sky.vo.OrderReportVO;
import com.sky.vo.SalesTop10ReportVO;
import com.sky.vo.TurnoverReportVO;
import com.sky.vo.UserReportVO;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private OrdersMapper ordersMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private OrderDetailMapper orderDetailMapper;

    @Override
    public TurnoverReportVO getTurnoverStatistics(LocalDate begin, LocalDate end) {
        validateDateRange(begin, end);

        List<String> dates = new ArrayList<>();
        List<String> turnoverValues = new ArrayList<>();
        for (LocalDate date : getDateRange(begin, end)) {
            dates.add(date.format(DATE_FORMATTER));
            BigDecimal turnover = safeAmount(ordersMapper.sumAmountByCondition(
                    Orders.COMPLETED,
                    Orders.PAID,
                    beginOfDay(date),
                    endOfDay(date)
            ));
            turnoverValues.add(turnover.toPlainString());
        }

        return TurnoverReportVO.builder()
                .dateList(String.join(",", dates))
                .turnoverList(String.join(",", turnoverValues))
                .build();
    }

    @Override
    public UserReportVO getUserStatistics(LocalDate begin, LocalDate end) {
        validateDateRange(begin, end);

        List<String> dates = new ArrayList<>();
        List<String> newUsers = new ArrayList<>();
        List<String> totalUsers = new ArrayList<>();
        for (LocalDate date : getDateRange(begin, end)) {
            LocalDateTime dayBegin = beginOfDay(date);
            LocalDateTime dayEnd = endOfDay(date);

            dates.add(date.format(DATE_FORMATTER));
            newUsers.add(String.valueOf(safeCount(userMapper.countByCreateTime(dayBegin, dayEnd))));
            totalUsers.add(String.valueOf(safeCount(userMapper.countTotalByCreateTime(dayEnd))));
        }

        return UserReportVO.builder()
                .dateList(String.join(",", dates))
                .newUserList(String.join(",", newUsers))
                .totalUserList(String.join(",", totalUsers))
                .build();
    }

    @Override
    public OrderReportVO getOrderStatistics(LocalDate begin, LocalDate end) {
        validateDateRange(begin, end);

        List<String> dates = new ArrayList<>();
        List<String> orderCounts = new ArrayList<>();
        List<String> validOrderCounts = new ArrayList<>();

        int totalOrderCount = 0;
        int totalValidOrderCount = 0;

        for (LocalDate date : getDateRange(begin, end)) {
            LocalDateTime dayBegin = beginOfDay(date);
            LocalDateTime dayEnd = endOfDay(date);

            int orderCount = safeCount(ordersMapper.countByCondition(null, null, dayBegin, dayEnd));
            int validOrderCount = safeCount(ordersMapper.countByCondition(Orders.COMPLETED, null, dayBegin, dayEnd));

            dates.add(date.format(DATE_FORMATTER));
            orderCounts.add(String.valueOf(orderCount));
            validOrderCounts.add(String.valueOf(validOrderCount));

            totalOrderCount += orderCount;
            totalValidOrderCount += validOrderCount;
        }

        return OrderReportVO.builder()
                .dateList(String.join(",", dates))
                .orderCountList(String.join(",", orderCounts))
                .validOrderCountList(String.join(",", validOrderCounts))
                .totalOrderCount(totalOrderCount)
                .validOrderCount(totalValidOrderCount)
                .orderCompletionRate(calculateRate(totalValidOrderCount, totalOrderCount))
                .build();
    }

    @Override
    public SalesTop10ReportVO getSalesTop10(LocalDate begin, LocalDate end) {
        validateDateRange(begin, end);

        List<GoodsSalesVO> sales = orderDetailMapper.getSalesTop10(beginOfDay(begin), endOfDay(end));
        List<String> names = new ArrayList<>();
        List<String> numbers = new ArrayList<>();
        for (GoodsSalesVO item : sales) {
            names.add(item.getName());
            numbers.add(String.valueOf(safeCount(item.getNumber())));
        }

        return SalesTop10ReportVO.builder()
                .nameList(String.join(",", names))
                .numberList(String.join(",", numbers))
                .build();
    }

    @Override
    public void exportBusinessData(HttpServletResponse response) {
        LocalDate today = LocalDate.now();
        BusinessDataVO businessData = getBusinessData(today, today);
        SalesTop10ReportVO salesTop10 = getSalesTop10(today, today);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        try {
            String fileName = URLEncoder.encode("day10-report-" + today, StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20");
            response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + fileName + ".xlsx");

            try (XSSFWorkbook workbook = new XSSFWorkbook();
                 ServletOutputStream outputStream = response.getOutputStream()) {
                XSSFSheet sheet = workbook.createSheet("运营数据");
                int rowIndex = 0;

                rowIndex = createTitle(sheet, rowIndex, "Sky 营业数据报表");
                rowIndex = createKeyValue(sheet, rowIndex, "统计日期", today.format(DATE_FORMATTER));
                rowIndex = createKeyValue(sheet, rowIndex, "订单总数", String.valueOf(businessData.getTotalOrders()));
                rowIndex = createKeyValue(sheet, rowIndex, "有效订单数", String.valueOf(businessData.getValidOrders()));
                rowIndex = createKeyValue(sheet, rowIndex, "营业额", businessData.getTurnover().toPlainString());
                rowIndex = createKeyValue(sheet, rowIndex, "订单完成率", businessData.getOrderCompletionRate().toPlainString() + "%");
                rowIndex = createKeyValue(sheet, rowIndex, "新增用户数", String.valueOf(businessData.getNewUsers()));
                rowIndex = createKeyValue(sheet, rowIndex, "平均客单价", businessData.getAverageUnitPrice().toPlainString());

                rowIndex++;
                rowIndex = createTitle(sheet, rowIndex, "今日销量 Top10");
                Row headerRow = sheet.createRow(rowIndex++);
                headerRow.createCell(0).setCellValue("商品名称");
                headerRow.createCell(1).setCellValue("销量");

                String[] names = splitCsv(salesTop10.getNameList());
                String[] numbers = splitCsv(salesTop10.getNumberList());
                for (int i = 0; i < Math.max(names.length, numbers.length); i++) {
                    Row row = sheet.createRow(rowIndex++);
                    row.createCell(0).setCellValue(i < names.length ? names[i] : "");
                    row.createCell(1).setCellValue(i < numbers.length ? numbers[i] : "");
                }

                sheet.autoSizeColumn(0);
                sheet.autoSizeColumn(1);
                workbook.write(outputStream);
                outputStream.flush();
            }
        } catch (IOException ex) {
            throw new BaseException("导出营业数据失败");
        }
    }

    private BusinessDataVO getBusinessData(LocalDate begin, LocalDate end) {
        LocalDateTime beginTime = beginOfDay(begin);
        LocalDateTime endTime = endOfDay(end);

        int totalOrders = safeCount(ordersMapper.countByCondition(null, null, beginTime, endTime));
        int validOrders = safeCount(ordersMapper.countByCondition(Orders.COMPLETED, null, beginTime, endTime));
        BigDecimal turnover = safeAmount(ordersMapper.sumAmountByCondition(Orders.COMPLETED, Orders.PAID, beginTime, endTime));
        int newUsers = safeCount(userMapper.countByCreateTime(beginTime, endTime));

        return BusinessDataVO.builder()
                .totalOrders(totalOrders)
                .validOrders(validOrders)
                .turnover(turnover)
                .orderCompletionRate(calculateRate(validOrders, totalOrders))
                .newUsers(newUsers)
                .averageUnitPrice(calculateAverage(turnover, validOrders))
                .build();
    }

    private List<LocalDate> getDateRange(LocalDate begin, LocalDate end) {
        List<LocalDate> dates = new ArrayList<>();
        for (LocalDate date = begin; !date.isAfter(end); date = date.plusDays(1)) {
            dates.add(date);
        }
        return dates;
    }

    private void validateDateRange(LocalDate begin, LocalDate end) {
        if (begin == null || end == null) {
            throw new BaseException("开始日期和结束日期不能为空");
        }
        if (begin.isAfter(end)) {
            throw new BaseException("开始日期不能晚于结束日期");
        }
    }

    private LocalDateTime beginOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    private LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX);
    }

    private Integer safeCount(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal safeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private BigDecimal calculateRate(int numerator, int denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAverage(BigDecimal amount, int count) {
        if (count <= 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private int createTitle(XSSFSheet sheet, int rowIndex, String title) {
        Row row = sheet.createRow(rowIndex++);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        return rowIndex;
    }

    private int createKeyValue(XSSFSheet sheet, int rowIndex, String key, String value) {
        Row row = sheet.createRow(rowIndex++);
        row.createCell(0).setCellValue(key);
        row.createCell(1).setCellValue(value);
        return rowIndex;
    }

    private String[] splitCsv(String content) {
        if (content == null || content.isEmpty()) {
            return new String[0];
        }
        return content.split(",");
    }
}
