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
@ApiModel(description = "工作台概览视图对象")
public class WorkspaceOverviewVO implements Serializable {

    @ApiModelProperty("菜品总数")
    private Integer dishTotal;

    @ApiModelProperty("起售菜品数")
    private Integer dishEnabled;

    @ApiModelProperty("套餐总数")
    private Integer setmealTotal;

    @ApiModelProperty("起售套餐数")
    private Integer setmealEnabled;

    @ApiModelProperty("订单总数")
    private Integer totalOrders;

    @ApiModelProperty("待接单数")
    private Integer toBeConfirmedOrders;

    @ApiModelProperty("派送中订单数")
    private Integer deliveryInProgressOrders;

    @ApiModelProperty("已完成订单数")
    private Integer completedOrders;

    @ApiModelProperty("营业额")
    private BigDecimal turnover;
}
