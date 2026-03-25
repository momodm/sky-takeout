package com.sky.service.impl;

import com.sky.constant.MessageConstant;
import com.sky.constant.StatusConstant;
import com.sky.component.CatalogCacheService;
import com.sky.dto.SetmealDTO;
import com.sky.entity.Setmeal;
import com.sky.entity.SetmealDish;
import com.sky.exception.DeletionNotAllowedException;
import com.sky.mapper.SetmealDishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.vo.SetmealVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SetmealServiceImplTest {

    @Mock
    private SetmealMapper setmealMapper;

    @Mock
    private SetmealDishMapper setmealDishMapper;

    @Mock
    private CatalogCacheService catalogCacheService;

    @InjectMocks
    private SetmealServiceImpl setmealService;

    @Test
    void saveWithDishShouldDefaultStatusAndSkipEmptyRelations() {
        SetmealDTO dto = new SetmealDTO();
        dto.setName("test");
        dto.setSetmealDishes(new ArrayList<>());

        doAnswer(invocation -> {
            Setmeal setmeal = invocation.getArgument(0);
            setmeal.setId(10L);
            return null;
        }).when(setmealMapper).insert(any(Setmeal.class));

        setmealService.saveWithDish(dto);

        ArgumentCaptor<Setmeal> captor = ArgumentCaptor.forClass(Setmeal.class);
        verify(setmealMapper).insert(captor.capture());
        assertEquals(StatusConstant.DISABLE, captor.getValue().getStatus());
        verify(setmealDishMapper, never()).insertBatch(any());
    }

    @Test
    void saveWithDishShouldPopulateSetmealIdForEachRelation() {
        SetmealDTO dto = new SetmealDTO();
        dto.setStatus(StatusConstant.ENABLE);
        dto.setSetmealDishes(new ArrayList<>(Arrays.asList(new SetmealDish(), new SetmealDish())));

        doAnswer(invocation -> {
            Setmeal setmeal = invocation.getArgument(0);
            setmeal.setId(20L);
            return null;
        }).when(setmealMapper).insert(any(Setmeal.class));

        setmealService.saveWithDish(dto);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SetmealDish>> captor = ArgumentCaptor.forClass(List.class);
        verify(setmealDishMapper).insertBatch(captor.capture());
        assertEquals(20L, captor.getValue().get(0).getSetmealId());
        assertEquals(20L, captor.getValue().get(1).getSetmealId());
    }

    @Test
    void getByIdWithDishShouldAssembleSetmealAndRelations() {
        Setmeal setmeal = Setmeal.builder()
                .id(30L)
                .name("combo")
                .categoryId(6L)
                .status(StatusConstant.ENABLE)
                .build();
        List<SetmealDish> dishes = Collections.singletonList(SetmealDish.builder().dishId(7L).build());

        when(setmealMapper.getById(30L)).thenReturn(setmeal);
        when(setmealDishMapper.getBySetmealId(30L)).thenReturn(dishes);

        SetmealVO setmealVO = setmealService.getByIdWithDish(30L);

        assertEquals(30L, setmealVO.getId());
        assertEquals("combo", setmealVO.getName());
        assertSame(dishes, setmealVO.getSetmealDishes());
    }

    @Test
    void updateWithDishShouldReplaceRelations() {
        SetmealDTO dto = new SetmealDTO();
        dto.setId(40L);
        dto.setName("updated");
        dto.setSetmealDishes(new ArrayList<>(Arrays.asList(new SetmealDish(), new SetmealDish())));

        setmealService.updateWithDish(dto);

        ArgumentCaptor<Setmeal> setmealCaptor = ArgumentCaptor.forClass(Setmeal.class);
        verify(setmealMapper).update(setmealCaptor.capture());
        assertEquals(40L, setmealCaptor.getValue().getId());
        assertEquals("updated", setmealCaptor.getValue().getName());

        verify(setmealDishMapper).deleteBySetmealIds(Collections.singletonList(40L));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SetmealDish>> relationCaptor = ArgumentCaptor.forClass(List.class);
        verify(setmealDishMapper).insertBatch(relationCaptor.capture());
        assertEquals(40L, relationCaptor.getValue().get(0).getSetmealId());
        assertEquals(40L, relationCaptor.getValue().get(1).getSetmealId());
    }

    @Test
    void deleteBatchShouldRejectOnSaleSetmeal() {
        List<Long> ids = Arrays.asList(1L, 2L);
        when(setmealMapper.countByIdsAndStatus(ids, StatusConstant.ENABLE)).thenReturn(1);

        DeletionNotAllowedException ex = assertThrows(
                DeletionNotAllowedException.class,
                () -> setmealService.deleteBatch(ids)
        );

        assertEquals(MessageConstant.SETMEAL_ON_SALE, ex.getMessage());
        verify(setmealMapper, never()).deleteByIds(any());
        verify(setmealDishMapper, never()).deleteBySetmealIds(any());
    }

    @Test
    void deleteBatchShouldDeleteSetmealAndRelations() {
        List<Long> ids = Arrays.asList(5L, 6L);
        when(setmealMapper.countByIdsAndStatus(ids, StatusConstant.ENABLE)).thenReturn(0);

        setmealService.deleteBatch(ids);

        verify(setmealMapper).deleteByIds(ids);
        verify(setmealDishMapper).deleteBySetmealIds(ids);
    }

    @Test
    void startOrStopShouldUpdateStatus() {
        setmealService.startOrStop(StatusConstant.DISABLE, 88L);

        ArgumentCaptor<Setmeal> captor = ArgumentCaptor.forClass(Setmeal.class);
        verify(setmealMapper).update(captor.capture());
        assertEquals(88L, captor.getValue().getId());
        assertEquals(StatusConstant.DISABLE, captor.getValue().getStatus());
    }

    @Test
    void listShouldQueryEnabledSetmealByCategory() {
        List<Setmeal> setmeals = Collections.singletonList(Setmeal.builder().id(1L).categoryId(4L).build());
        when(catalogCacheService.buildSetmealListKey(4L)).thenReturn("USER_SETMEAL_LIST:4");
        when(catalogCacheService.getList("USER_SETMEAL_LIST:4", Setmeal.class)).thenReturn(null);
        when(setmealMapper.list(org.mockito.ArgumentMatchers.any(Setmeal.class))).thenReturn(setmeals);

        List<Setmeal> result = setmealService.list(4L);

        assertSame(setmeals, result);
    }

    @Test
    void listShouldReturnCachedSetmealsWhenAvailable() {
        List<Setmeal> cached = Collections.singletonList(Setmeal.builder().id(11L).name("cached").build());
        when(catalogCacheService.buildSetmealListKey(4L)).thenReturn("USER_SETMEAL_LIST:4");
        when(catalogCacheService.getList("USER_SETMEAL_LIST:4", Setmeal.class)).thenReturn(cached);

        List<Setmeal> result = setmealService.list(4L);

        assertSame(cached, result);
        verify(setmealMapper, never()).list(any(Setmeal.class));
    }

    @Test
    void startOrStopShouldClearSetmealCache() {
        setmealService.startOrStop(StatusConstant.ENABLE, 66L);

        verify(catalogCacheService).clearSetmealCache();
    }
}
