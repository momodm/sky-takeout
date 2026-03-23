package com.sky.service.impl;

import com.sky.constant.RedisConstant;
import com.sky.constant.StatusConstant;
import com.sky.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ShopServiceImpl implements ShopService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public void setStatus(Integer status) {
        stringRedisTemplate.opsForValue().set(RedisConstant.SHOP_STATUS, String.valueOf(status));
    }

    @Override
    public Integer getStatus() {
        String status = stringRedisTemplate.opsForValue().get(RedisConstant.SHOP_STATUS);
        return status == null ? StatusConstant.ENABLE : Integer.valueOf(status);
    }
}
