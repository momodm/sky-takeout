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
import com.sky.service.ShoppingCartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShoppingCartServiceImpl implements ShoppingCartService {

    @Autowired
    private ShoppingCartMapper shoppingCartMapper;

    @Autowired
    private DishMapper dishMapper;

    @Autowired
    private SetmealMapper setmealMapper;

    @Override
    public ShoppingCart add(ShoppingCartDTO shoppingCartDTO) {
        Long userId = getCurrentUserId();
        ShoppingCart shoppingCart = buildQueryCondition(userId, shoppingCartDTO);
        List<ShoppingCart> shoppingCartList = shoppingCartMapper.list(shoppingCart);
        if (!shoppingCartList.isEmpty()) {
            // 购物车已存在相同商品和规格时，只累加数量。
            ShoppingCart existing = shoppingCartList.get(0);
            existing.setNumber(existing.getNumber() + 1);
            shoppingCartMapper.updateNumberById(existing);
            return existing;
        }

        // 首次加入购物车时，需要补齐名称、图片和价格等展示字段。
        ShoppingCart newItem = createCartItem(userId, shoppingCartDTO);
        shoppingCartMapper.insert(newItem);
        return newItem;
    }

    @Override
    public ShoppingCart sub(ShoppingCartDTO shoppingCartDTO) {
        Long userId = getCurrentUserId();
        ShoppingCart query = buildQueryCondition(userId, shoppingCartDTO);
        List<ShoppingCart> shoppingCartList = shoppingCartMapper.list(query);
        if (shoppingCartList.isEmpty()) {
            throw new BaseException("购物车商品不存在");
        }

        ShoppingCart existing = shoppingCartList.get(0);
        if (existing.getNumber() != null && existing.getNumber() > 1) {
            // 数量大于 1 时只做减一，保留当前购物车项。
            existing.setNumber(existing.getNumber() - 1);
            shoppingCartMapper.updateNumberById(existing);
        } else {
            // 数量减到 0 时直接删除记录，避免留下无效购物车数据。
            shoppingCartMapper.deleteById(existing.getId());
            existing.setNumber(0);
        }
        return existing;
    }

    @Override
    public List<ShoppingCart> list() {
        return shoppingCartMapper.listByUserId(getCurrentUserId());
    }

    @Override
    public void clean() {
        shoppingCartMapper.deleteByUserId(getCurrentUserId());
    }

    private Long getCurrentUserId() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new BaseException("用户未登录");
        }
        return userId;
    }

    private ShoppingCart buildQueryCondition(Long userId, ShoppingCartDTO shoppingCartDTO) {
        return ShoppingCart.builder()
                .userId(userId)
                .dishId(shoppingCartDTO.getDishId())
                .setmealId(shoppingCartDTO.getSetmealId())
                .dishFlavor(shoppingCartDTO.getDishFlavor())
                .build();
    }

    private ShoppingCart createCartItem(Long userId, ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = buildQueryCondition(userId, shoppingCartDTO);
        shoppingCart.setNumber(1);
        shoppingCart.setCreateTime(LocalDateTime.now());

        // 菜品加入购物车时，保存一份菜品快照，后续直接读取购物车展示。
        if (shoppingCartDTO.getDishId() != null) {
            Dish dish = dishMapper.getById(shoppingCartDTO.getDishId());
            if (dish == null) {
                throw new BaseException("菜品不存在");
            }
            shoppingCart.setName(dish.getName());
            shoppingCart.setImage(dish.getImage());
            shoppingCart.setAmount(dish.getPrice());
            return shoppingCart;
        }

        // 套餐与菜品共用购物车表，通过 setmealId / dishId 区分来源。
        if (shoppingCartDTO.getSetmealId() != null) {
            Setmeal setmeal = setmealMapper.getById(shoppingCartDTO.getSetmealId());
            if (setmeal == null) {
                throw new BaseException("套餐不存在");
            }
            shoppingCart.setName(setmeal.getName());
            shoppingCart.setImage(setmeal.getImage());
            shoppingCart.setAmount(setmeal.getPrice());
            return shoppingCart;
        }

        throw new BaseException("购物车商品参数错误");
    }
}
