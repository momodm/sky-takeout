package com.sky.controller.user;

import com.sky.dto.OrdersSubmitDTO;
import com.sky.result.PageResult;
import com.sky.result.Result;
import com.sky.service.OrderService;
import com.sky.vo.OrderSubmitVO;
import com.sky.vo.OrderVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("userOrderController")
@RequestMapping("/user/order")
@Api(tags = "用户端订单接口")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/submit")
    @ApiOperation("提交订单")
    public Result<OrderSubmitVO> submit(@RequestBody OrdersSubmitDTO ordersSubmitDTO) {
        // 用户提交订单时，服务层会完成下单校验、订单落库和购物车清空。
        return Result.success(orderService.submit(ordersSubmitDTO));
    }

    @GetMapping("/historyOrders")
    @ApiOperation("历史订单分页查询")
    public Result<PageResult> historyOrders(@RequestParam Integer page, @RequestParam Integer pageSize,
                                            @RequestParam(required = false) Integer status) {
        // 历史订单支持按状态筛选，便于用户查看待支付、配送中等不同阶段订单。
        return Result.success(orderService.historyOrders(page, pageSize, status));
    }

    @GetMapping("/orderDetail/{id}")
    @ApiOperation("订单详情查询")
    public Result<OrderVO> orderDetail(@PathVariable Long id) {
        return Result.success(orderService.orderDetail(id));
    }

    @PutMapping("/payment/{id}")
    @ApiOperation("模拟支付成功")
    public Result<String> payment(@PathVariable Long id) {
        // 当前项目用模拟支付推进订单状态，便于联调后续接单和提醒流程。
        orderService.payment(id);
        return Result.success();
    }

    @PutMapping("/reminder/{id}")
    @ApiOperation("催单")
    public Result<String> reminder(@PathVariable Long id) {
        // 催单接口只触发提醒链路，不直接修改订单主状态。
        orderService.reminder(id);
        return Result.success();
    }

    @PutMapping("/cancel/{id}")
    @ApiOperation("用户取消订单")
    public Result<String> cancel(@PathVariable Long id) {
        orderService.cancelByUser(id);
        return Result.success();
    }

    @PutMapping("/repetition/{id}")
    @ApiOperation("再来一单")
    public Result<String> repetition(@PathVariable Long id) {
        // 再来一单会把历史订单明细重新回填到当前用户的购物车。
        orderService.repetition(id);
        return Result.success();
    }
}
