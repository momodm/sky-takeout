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
@ApiModel(description = "订单统计报表")
public class OrderReportVO implements Serializable {

    @ApiModelProperty("日期列表，逗号分隔")
    private String dateList;

    @ApiModelProperty("每日订单数列表，逗号分隔")
    private String orderCountList;

    @ApiModelProperty("每日有效订单数列表，逗号分隔")
    private String validOrderCountList;

    @ApiModelProperty("统计区间内订单总数")
    private Integer totalOrderCount;

    @ApiModelProperty("统计区间内有效订单总数")
    private Integer validOrderCount;

    @ApiModelProperty("统计区间内订单完成率")
    private BigDecimal orderCompletionRate;
}
