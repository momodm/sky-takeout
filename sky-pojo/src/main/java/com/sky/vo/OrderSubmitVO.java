package com.sky.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "提交订单返回对象")
public class OrderSubmitVO implements Serializable {

    @ApiModelProperty("订单 ID")
    private Long id;

    @ApiModelProperty("订单号")
    private String orderNumber;

    @ApiModelProperty("订单金额")
    private BigDecimal orderAmount;

    @ApiModelProperty("下单时间")
    private LocalDateTime orderTime;
}
