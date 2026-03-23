package com.sky.dto;

import io.swagger.annotations.ApiModel;
import lombok.Data;
import java.io.Serializable;

@Data
@ApiModel(description = "菜品分页查询传递的数据模型")
public class DishPageQueryDTO implements Serializable {

    private int page;

    private int pageSize;

    private String name;

    //分类id
    private Integer categoryId;

    //状态 0停售 1起售
    private Integer status;

}
