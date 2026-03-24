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
@ApiModel(description = "销量前十报表")
public class SalesTop10ReportVO implements Serializable {

    @ApiModelProperty("商品名称列表，逗号分隔")
    private String nameList;

    @ApiModelProperty("销量列表，逗号分隔")
    private String numberList;
}
