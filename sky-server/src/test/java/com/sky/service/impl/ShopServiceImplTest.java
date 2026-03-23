package com.sky.service.impl;

import com.sky.constant.RedisConstant;
import com.sky.constant.StatusConstant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopServiceImplTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private ShopServiceImpl shopService;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void setStatusShouldWriteRedis() {
        shopService.setStatus(StatusConstant.DISABLE);

        verify(valueOperations).set(RedisConstant.SHOP_STATUS, String.valueOf(StatusConstant.DISABLE));
    }

    @Test
    void getStatusShouldDefaultToEnableWhenRedisMissing() {
        when(valueOperations.get(RedisConstant.SHOP_STATUS)).thenReturn(null);

        Integer status = shopService.getStatus();

        assertEquals(StatusConstant.ENABLE, status);
    }

    @Test
    void getStatusShouldReturnStoredRedisValue() {
        when(valueOperations.get(RedisConstant.SHOP_STATUS)).thenReturn("0");

        Integer status = shopService.getStatus();

        assertEquals(StatusConstant.DISABLE, status);
    }
}
