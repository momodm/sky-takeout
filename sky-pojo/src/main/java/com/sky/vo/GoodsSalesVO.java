package com.sky.vo;

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
@ApiModel(description = "商品销量视图对象")
public class GoodsSalesVO implements Serializable {

    @ApiModelProperty("商品名称")
    private String name;

    @ApiModelProperty("销量")
    private Integer number;
}
