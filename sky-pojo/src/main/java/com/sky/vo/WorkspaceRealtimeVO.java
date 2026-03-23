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
@ApiModel(description = "工作台实时视图对象")
public class WorkspaceRealtimeVO implements Serializable {

    @ApiModelProperty("WebSocket 在线连接数")
    private Integer websocketOnlineCount;

    @ApiModelProperty("待支付订单数")
    private Integer pendingPaymentOrders;

    @ApiModelProperty("待接单订单数")
    private Integer toBeConfirmedOrders;

    @ApiModelProperty("派送中订单数")
    private Integer deliveryInProgressOrders;

    @ApiModelProperty("今日订单数")
    private Integer todayOrders;

    @ApiModelProperty("今日营业额")
    private BigDecimal todayTurnover;

    @ApiModelProperty("今日新增用户数")
    private Integer todayUsers;

    @ApiModelProperty("今日订单完成率")
    private BigDecimal todayCompletionRate;
}
