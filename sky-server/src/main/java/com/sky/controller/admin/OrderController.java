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
@Api(tags = "订单管理接口")
@Slf4j
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/conditionSearch")
    @ApiOperation("订单条件分页查询")
    public Result<PageResult> conditionSearch(OrdersPageQueryDTO ordersPageQueryDTO) {
        // 管理端按时间、状态等条件筛选订单，方便接单台和后台列表联动。
        log.info("订单条件分页查询: {}", ordersPageQueryDTO);
        return Result.success(orderService.conditionSearch(ordersPageQueryDTO));
    }

    @GetMapping("/details/{id}")
    @ApiOperation("订单详情查询")
    public Result<OrderVO> details(@PathVariable Long id) {
        log.info("订单详情查询: {}", id);
        return Result.success(orderService.adminOrderDetail(id));
    }

    @PutMapping("/confirm")
    @ApiOperation("接单")
    public Result<String> confirm(@RequestBody Orders orders) {
        // 接单后订单会从待接单推进到已接单状态。
        log.info("接单: {}", orders);
        orderService.confirm(orders);
        return Result.success();
    }

    @PutMapping("/rejection")
    @ApiOperation("拒单")
    public Result<String> rejection(@RequestBody Orders orders) {
        // 拒单会关闭订单，并记录拒单原因供用户侧查看。
        log.info("拒单: {}", orders);
        orderService.rejection(orders);
        return Result.success();
    }

    @PutMapping("/cancel")
    @ApiOperation("取消订单")
    public Result<String> cancel(@RequestBody Orders orders) {
        // 管理端取消订单用于处理异常履约场景，和用户主动取消区分开。
        log.info("取消订单: {}", orders);
        orderService.cancel(orders);
        return Result.success();
    }

    @PutMapping("/delivery/{id}")
    @ApiOperation("派送订单")
    public Result<String> delivery(@PathVariable Long id) {
        // 派送接口用于把已接单订单推进到配送中阶段。
        log.info("派送订单: {}", id);
        orderService.delivery(id);
        return Result.success();
    }

    @PutMapping("/complete/{id}")
    @ApiOperation("完成订单")
    public Result<String> complete(@PathVariable Long id) {
        // 完成订单意味着本次履约闭环结束，并会写入送达时间。
        log.info("完成订单: {}", id);
        orderService.complete(id);
        return Result.success();
    }
}
