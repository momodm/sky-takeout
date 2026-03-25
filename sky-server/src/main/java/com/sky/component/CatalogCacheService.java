package com.sky.component;

import com.sky.constant.RedisConstant;
import com.sky.json.JacksonObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CatalogCacheService {

    private final JacksonObjectMapper objectMapper = new JacksonObjectMapper();

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    public String buildCategoryListKey(Integer type) {
        return RedisConstant.USER_CATEGORY_LIST_PREFIX + (type == null ? "all" : type);
    }

    public String buildDishListKey(Long categoryId) {
        return RedisConstant.USER_DISH_LIST_PREFIX + categoryId;
    }

    public String buildSetmealListKey(Long categoryId) {
        return RedisConstant.USER_SETMEAL_LIST_PREFIX + categoryId;
    }

    public <T> List<T> getList(String key, Class<T> elementType) {
        String json;
        try {
            json = stringRedisTemplate.opsForValue().get(key);
        } catch (Exception ex) {
            // Day 11 的目标之一是“缓存增强但不牺牲可用性”，所以 Redis 不可用时直接降级到数据库查询。
            log.warn("Failed to read catalog cache from redis, key={}", key, ex);
            return null;
        }
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(
                    json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, elementType)
            );
        } catch (Exception ex) {
            log.warn("Failed to read catalog cache, key={}", key, ex);
            return null;
        }
    }

    public void putList(String key, List<?> data) {
        try {
            StringRedisTemplate redisTemplate = stringRedisTemplate;
            redisTemplate.opsForValue().set(
                    key,
                    objectMapper.writeValueAsString(data),
                    RedisConstant.USER_CATALOG_CACHE_TTL_MINUTES,
                    TimeUnit.MINUTES
            );
        } catch (Exception ex) {
            log.warn("Failed to write catalog cache, key={}", key, ex);
        }
    }

    public void clearCategoryCache() {
        clearByPrefix(RedisConstant.USER_CATEGORY_LIST_PREFIX);
    }

    public void clearDishCache() {
        clearByPrefix(RedisConstant.USER_DISH_LIST_PREFIX);
    }

    public void clearSetmealCache() {
        clearByPrefix(RedisConstant.USER_SETMEAL_LIST_PREFIX);
    }

    private void clearByPrefix(String prefix) {
        try {
            Set<String> keys = stringRedisTemplate.keys(prefix + "*");
            if (keys == null || keys.isEmpty()) {
                return;
            }
            stringRedisTemplate.delete(keys);
        } catch (Exception ex) {
            // 清理失败只影响缓存新鲜度，不应该影响主业务流程。
            log.warn("Failed to clear catalog cache, prefix={}", prefix, ex);
        }
    }
}
