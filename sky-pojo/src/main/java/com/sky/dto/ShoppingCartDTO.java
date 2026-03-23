package com.sky.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "购物车操作对象")
public class ShoppingCartDTO implements Serializable {

    @ApiModelProperty("菜品 ID")
    private Long dishId;

    @ApiModelProperty("套餐 ID")
    private Long setmealId;

    @ApiModelProperty("菜品口味")
    private String dishFlavor;
}
