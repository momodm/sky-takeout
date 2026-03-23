package com.sky.service.impl;

import com.sky.constant.StatusConstant;
import com.sky.entity.Dish;
import com.sky.entity.DishFlavor;
import com.sky.exception.BaseException;
import com.sky.mapper.DishFlavorMapper;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealDishMapper;
import com.sky.vo.DishVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DishServiceImplTest {

    @Mock
    private DishMapper dishMapper;

    @Mock
    private DishFlavorMapper dishFlavorMapper;

    @Mock
    private SetmealDishMapper setmealDishMapper;

    @InjectMocks
    private DishServiceImpl dishService;

    @Test
    void getByIdWithFlavorShouldRejectMissingDish() {
        when(dishMapper.getById(88L)).thenReturn(null);

        BaseException ex = assertThrows(BaseException.class, () -> dishService.getByIdWithFlavor(88L));

        assertEquals("菜品不存在", ex.getMessage());
    }

    @Test
    void deleteBatchShouldRejectMissingDish() {
        when(dishMapper.getById(77L)).thenReturn(null);

        BaseException ex = assertThrows(BaseException.class, () -> dishService.deleteBatch(Collections.singletonList(77L)));

        assertEquals("菜品不存在", ex.getMessage());
    }

    @Test
    void listWithFlavorShouldAssembleFlavors() {
        Dish dish = Dish.builder()
                .id(1L)
                .categoryId(2L)
                .name("cola")
                .status(StatusConstant.ENABLE)
                .build();
        List<DishFlavor> flavors = Collections.singletonList(DishFlavor.builder().dishId(1L).name("temp").build());
        when(dishMapper.list(ArgumentMatchers.any(Dish.class))).thenReturn(Collections.singletonList(dish));
        when(dishFlavorMapper.getByDishId(1L)).thenReturn(flavors);

        List<DishVO> result = dishService.listWithFlavor(2L);

        assertEquals(1, result.size());
        assertEquals("cola", result.get(0).getName());
        assertEquals(flavors, result.get(0).getFlavors());
    }
}
