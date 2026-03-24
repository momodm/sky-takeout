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
@ApiModel(description = "营业数据视图对象")
public class BusinessDataVO implements Serializable {

    @ApiModelProperty("订单总数")
    private Integer totalOrders;

    @ApiModelProperty("有效订单数")
    private Integer validOrders;

    @ApiModelProperty("营业额")
    private BigDecimal turnover;

    @ApiModelProperty("订单完成率")
    private BigDecimal orderCompletionRate;

    @ApiModelProperty("新增用户数")
    private Integer newUsers;

    @ApiModelProperty("平均客单价")
    private BigDecimal averageUnitPrice;
}
