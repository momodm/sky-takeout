package com.sky.service.impl;

import com.sky.context.BaseContext;
import com.sky.dto.ShoppingCartDTO;
import com.sky.entity.Dish;
import com.sky.entity.Setmeal;
import com.sky.entity.ShoppingCart;
import com.sky.exception.BaseException;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.mapper.ShoppingCartMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShoppingCartServiceImplTest {

    @Mock
    private ShoppingCartMapper shoppingCartMapper;

    @Mock
    private DishMapper dishMapper;

    @Mock
    private SetmealMapper setmealMapper;

    @InjectMocks
    private ShoppingCartServiceImpl shoppingCartService;

    @AfterEach
    void tearDown() {
        BaseContext.removeCurrentId();
    }

    @Test
    void addShouldCreateDishCartItemWhenNotExists() {
        BaseContext.setCurrentId(8L);
        ShoppingCartDTO dto = ShoppingCartDTO.builder().dishId(2L).dishFlavor("微辣").build();
        when(shoppingCartMapper.list(any(ShoppingCart.class))).thenReturn(Collections.emptyList());
        when(dishMapper.getById(2L)).thenReturn(Dish.builder()
                .id(2L)
                .name("宫保鸡丁")
                .price(new BigDecimal("18.00"))
                .image("dish.png")
                .build());
        doAnswer(invocation -> {
            ShoppingCart shoppingCart = invocation.getArgument(0);
            shoppingCart.setId(3L);
            return null;
        }).when(shoppingCartMapper).insert(any(ShoppingCart.class));

        ShoppingCart shoppingCart = shoppingCartService.add(dto);

        assertEquals(3L, shoppingCart.getId());
        assertEquals(8L, shoppingCart.getUserId());
        assertEquals(1, shoppingCart.getNumber());
        assertEquals("宫保鸡丁", shoppingCart.getName());
        assertNotNull(shoppingCart.getCreateTime());
    }

    @Test
    void addShouldIncrementExistingCartItem() {
        BaseContext.setCurrentId(8L);
        ShoppingCart existing = ShoppingCart.builder()
                .id(5L)
                .userId(8L)
                .dishId(2L)
                .dishFlavor("微辣")
                .number(1)
                .build();
        when(shoppingCartMapper.list(any(ShoppingCart.class))).thenReturn(Collections.singletonList(existing));

        ShoppingCart shoppingCart = shoppingCartService.add(ShoppingCartDTO.builder()
                .dishId(2L)
                .dishFlavor("微辣")
                .build());

        assertEquals(2, shoppingCart.getNumber());
        verify(shoppingCartMapper).updateNumberById(existing);
        verify(dishMapper, never()).getById(any());
    }

    @Test
    void subShouldDeleteWhenNumberBecomesZero() {
        BaseContext.setCurrentId(8L);
        ShoppingCart existing = ShoppingCart.builder()
                .id(5L)
                .userId(8L)
                .setmealId(10L)
                .number(1)
                .build();
        when(shoppingCartMapper.list(any(ShoppingCart.class))).thenReturn(Collections.singletonList(existing));

        ShoppingCart shoppingCart = shoppingCartService.sub(ShoppingCartDTO.builder()
                .setmealId(10L)
                .build());

        assertEquals(0, shoppingCart.getNumber());
        verify(shoppingCartMapper).deleteById(5L);
    }

    @Test
    void subShouldThrowWhenCartItemMissing() {
        BaseContext.setCurrentId(8L);
        when(shoppingCartMapper.list(any(ShoppingCart.class))).thenReturn(Collections.emptyList());

        BaseException ex = assertThrows(BaseException.class, () -> shoppingCartService.sub(ShoppingCartDTO.builder()
                .dishId(99L)
                .build()));

        assertEquals("购物车商品不存在", ex.getMessage());
    }

    @Test
    void addShouldCreateSetmealCartItemWhenDishIdMissing() {
        BaseContext.setCurrentId(9L);
        when(shoppingCartMapper.list(any(ShoppingCart.class))).thenReturn(Collections.emptyList());
        when(setmealMapper.getById(4L)).thenReturn(Setmeal.builder()
                .id(4L)
                .name("双人套餐")
                .price(new BigDecimal("39.90"))
                .image("setmeal.png")
                .build());

        shoppingCartService.add(ShoppingCartDTO.builder().setmealId(4L).build());

        ArgumentCaptor<ShoppingCart> captor = ArgumentCaptor.forClass(ShoppingCart.class);
        verify(shoppingCartMapper).insert(captor.capture());
        assertEquals("双人套餐", captor.getValue().getName());
        assertEquals(new BigDecimal("39.90"), captor.getValue().getAmount());
    }
}
