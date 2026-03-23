package com.sky.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "订单统计视图对象")
public class OrderStatisticsVO implements Serializable {

    @ApiModelProperty("订单总数")
    private Integer totalOrders;

    @ApiModelProperty("待支付订单数")
    private Integer pendingPaymentOrders;

    @ApiModelProperty("待接单订单数")
    private Integer toBeConfirmedOrders;

    @ApiModelProperty("已接单订单数")
    private Integer confirmedOrders;

    @ApiModelProperty("派送中订单数")
    private Integer deliveryInProgressOrders;

    @ApiModelProperty("已完成订单数")
    private Integer completedOrders;

    @ApiModelProperty("已取消订单数")
    private Integer cancelledOrders;

    @ApiModelProperty("已支付订单数")
    private Integer paidOrders;

    @ApiModelProperty("未支付订单数")
    private Integer unpaidOrders;

    @ApiModelProperty("营业额")
    private BigDecimal turnover;
}
