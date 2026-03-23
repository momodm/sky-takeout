package com.sky.vo;

import com.sky.entity.OrderDetail;
import com.sky.entity.Orders;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "订单视图对象")
public class OrderVO implements Serializable {

    @ApiModelProperty("订单信息")
    private Orders orders;

    @Builder.Default
    @ApiModelProperty("订单明细")
    private List<OrderDetail> orderDetails = new ArrayList<>();
}
