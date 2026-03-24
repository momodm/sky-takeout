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
@ApiModel(description = "营业额报表")
public class TurnoverReportVO implements Serializable {

    @ApiModelProperty("日期列表，逗号分隔")
    private String dateList;

    @ApiModelProperty("营业额列表，逗号分隔")
    private String turnoverList;
}
