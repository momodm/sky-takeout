package com.sky.controller.admin;

import com.sky.dto.OrdersPageQueryDTO;
import com.sky.entity.Orders;
import com.sky.result.PageResult;
import com.sky.result.Result;
import com.sky.service.OrderService;
import com.sky.vo.OrderVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("adminOrderController")
@RequestMapping("/admin/order")
@Api(tags = "璁㈠崟绠＄悊鎺ュ彛")
@Slf4j
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/conditionSearch")
    @ApiOperation("璁㈠崟鏉′欢鍒嗛〉鏌ヨ")
    public Result<PageResult> conditionSearch(OrdersPageQueryDTO ordersPageQueryDTO) {
        // ??????????????????????????????
        log.info("璁㈠崟鏉′欢鍒嗛〉鏌ヨ: {}", ordersPageQueryDTO);
        return Result.success(orderService.conditionSearch(ordersPageQueryDTO));
    }

    @GetMapping("/details/{id}")
    @ApiOperation("璁㈠崟璇︽儏鏌ヨ")
    public Result<OrderVO> details(@PathVariable Long id) {
        log.info("璁㈠崟璇︽儏鏌ヨ: {}", id);
        return Result.success(orderService.adminOrderDetail(id));
    }

    @PutMapping("/confirm")
    @ApiOperation("鎺ュ崟")
    public Result<String> confirm(@RequestBody Orders orders) {
        // ???????????????????
        log.info("鎺ュ崟: {}", orders);
        orderService.confirm(orders);
        return Result.success();
    }

    @PutMapping("/rejection")
    @ApiOperation("鎷掑崟")
    public Result<String> rejection(@RequestBody Orders orders) {
        // ??????????????????????
        log.info("鎷掑崟: {}", orders);
        orderService.rejection(orders);
        return Result.success();
    }

    @PutMapping("/cancel")
    @ApiOperation("鍙栨秷璁㈠崟")
    public Result<String> cancel(@RequestBody Orders orders) {
        // ?????????????????????????????
        log.info("鍙栨秷璁㈠崟: {}", orders);
        orderService.cancel(orders);
        return Result.success();
    }

    @PutMapping("/delivery/{id}")
    @ApiOperation("娲鹃€佽鍗?)
    public Result<String> delivery(@PathVariable Long id) {
        // ?????????????????????
        log.info("娲鹃€佽鍗? {}", id);
        orderService.delivery(id);
        return Result.success();
    }

    @PutMapping("/complete/{id}")
    @ApiOperation("瀹屾垚璁㈠崟")
    public Result<String> complete(@PathVariable Long id) {
        // ?????????????????????????
        log.info("瀹屾垚璁㈠崟: {}", id);
        orderService.complete(id);
        return Result.success();
    }
}
