package com.sky.constant;

public class RedisConstant {

    private RedisConstant() {
    }

    public static final String SHOP_STATUS = "SHOP_STATUS";
    public static final String USER_CATEGORY_LIST_PREFIX = "USER_CATEGORY_LIST:";
    public static final String USER_DISH_LIST_PREFIX = "USER_DISH_LIST:";
    public static final String USER_SETMEAL_LIST_PREFIX = "USER_SETMEAL_LIST:";
    public static final long USER_CATALOG_CACHE_TTL_MINUTES = 30L;
}
