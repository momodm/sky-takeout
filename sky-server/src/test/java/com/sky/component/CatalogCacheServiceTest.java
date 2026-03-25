package com.sky.component;

import com.sky.entity.Category;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogCacheServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private CatalogCacheService catalogCacheService;

    @Test
    void getListShouldReturnNullWhenRedisUnavailable() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("USER_CATEGORY_LIST:1"))
                .thenThrow(new RedisConnectionFailureException("redis down"));

        List<Category> result = catalogCacheService.getList("USER_CATEGORY_LIST:1", Category.class);

        assertNull(result);
    }

    @Test
    void clearCategoryCacheShouldIgnoreRedisFailure() {
        doThrow(new RedisConnectionFailureException("redis down"))
                .when(stringRedisTemplate).keys("USER_CATEGORY_LIST:*");

        catalogCacheService.clearCategoryCache();

        verify(stringRedisTemplate).keys("USER_CATEGORY_LIST:*");
    }
}
