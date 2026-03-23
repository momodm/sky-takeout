package com.sky.service.impl;

import com.sky.constant.MessageConstant;
import com.sky.exception.DeletionNotAllowedException;
import com.sky.mapper.CategoryMapper;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private DishMapper dishMapper;

    @Mock
    private SetmealMapper setmealMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void deleteByIdShouldRejectWhenDishExists() {
        when(dishMapper.countByCategoryId(1L)).thenReturn(1);

        DeletionNotAllowedException ex = assertThrows(
                DeletionNotAllowedException.class,
                () -> categoryService.deleteById(1L)
        );

        assertEquals(MessageConstant.CATEGORY_BE_RELATED_BY_DISH, ex.getMessage());
        verify(categoryMapper, never()).deleteById(1L);
    }

    @Test
    void deleteByIdShouldRejectWhenSetmealExists() {
        when(dishMapper.countByCategoryId(2L)).thenReturn(0);
        when(setmealMapper.countByCategoryId(2L)).thenReturn(2);

        DeletionNotAllowedException ex = assertThrows(
                DeletionNotAllowedException.class,
                () -> categoryService.deleteById(2L)
        );

        assertEquals(MessageConstant.CATEGORY_BE_RELATED_BY_SETMEAL, ex.getMessage());
        verify(categoryMapper, never()).deleteById(2L);
    }

    @Test
    void deleteByIdShouldDeleteWhenNoRelationExists() {
        when(dishMapper.countByCategoryId(3L)).thenReturn(0);
        when(setmealMapper.countByCategoryId(3L)).thenReturn(0);

        categoryService.deleteById(3L);

        verify(categoryMapper).deleteById(3L);
    }
}
