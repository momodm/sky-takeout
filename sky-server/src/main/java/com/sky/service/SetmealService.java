package com.sky.service;

import com.sky.dto.SetmealDTO;
import com.sky.dto.SetmealPageQueryDTO;
import com.sky.entity.Setmeal;
import com.sky.result.PageResult;
import com.sky.vo.SetmealVO;

import java.util.List;

public interface SetmealService {

    void saveWithDish(SetmealDTO setmealDTO);

    PageResult pageQuery(SetmealPageQueryDTO setmealPageQueryDTO);

    SetmealVO getByIdWithDish(Long id);

    void updateWithDish(SetmealDTO setmealDTO);

    void deleteBatch(List<Long> ids);

    void startOrStop(Integer status, Long id);

    List<Setmeal> list(Long categoryId);
}
