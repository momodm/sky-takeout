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
@ApiModel(description = "用户登录返回对象")
public class UserLoginVO implements Serializable {

    @ApiModelProperty("用户 id")
    private Long id;

    @ApiModelProperty("openid")
    private String openid;

    @ApiModelProperty("jwt")
    private String token;
}
