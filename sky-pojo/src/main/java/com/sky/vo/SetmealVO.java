package com.sky.vo;

import com.sky.entity.SetmealDish;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "套餐视图对象")
public class SetmealVO implements Serializable {

    @ApiModelProperty("主键")
    private Long id;

    @ApiModelProperty("分类 ID")
    private Long categoryId;

    @ApiModelProperty("套餐名称")
    private String name;

    @ApiModelProperty("套餐价格")
    private BigDecimal price;

    @ApiModelProperty("状态 0:停售 1:起售")
    private Integer status;

    @ApiModelProperty("描述")
    private String description;

    @ApiModelProperty("图片")
    private String image;

    @ApiModelProperty("更新时间")
    private LocalDateTime updateTime;

    @ApiModelProperty("分类名称")
    private String categoryName;

    @Builder.Default
    @ApiModelProperty("套餐菜品关系")
    private List<SetmealDish> setmealDishes = new ArrayList<>();
}
