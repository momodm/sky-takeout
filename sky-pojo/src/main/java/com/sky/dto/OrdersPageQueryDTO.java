package com.sky.dto;

import io.swagger.annotations.ApiModel;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@ApiModel(description = "订单分页查询参数")
public class OrdersPageQueryDTO implements Serializable {

    private int page;

    private int pageSize;

    private String number;

    private String phone;

    private Integer status;

    private LocalDateTime beginTime;

    private LocalDateTime endTime;
}
