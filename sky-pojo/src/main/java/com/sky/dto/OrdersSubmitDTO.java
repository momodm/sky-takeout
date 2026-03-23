package com.sky.dto;

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
@ApiModel(description = "用户提交订单对象")
public class OrdersSubmitDTO implements Serializable {

    @ApiModelProperty("地址簿 ID")
    private Long addressBookId;

    @ApiModelProperty("备注")
    private String remark;

    @ApiModelProperty("支付方式")
    private Integer payMethod;

    @ApiModelProperty("预计送达时间")
    private LocalDateTime estimatedDeliveryTime;

    @ApiModelProperty("打包费")
    private BigDecimal packAmount;

    @ApiModelProperty("餐具数量")
    private Integer tablewareNumber;
}
