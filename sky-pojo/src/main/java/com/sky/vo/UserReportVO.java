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
@ApiModel(description = "用户统计报表")
public class UserReportVO implements Serializable {

    @ApiModelProperty("日期列表，逗号分隔")
    private String dateList;

    @ApiModelProperty("每日新增用户列表，逗号分隔")
    private String newUserList;

    @ApiModelProperty("每日累计用户列表，逗号分隔")
    private String totalUserList;
}
