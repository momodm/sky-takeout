package com.sky.service;

import com.sky.dto.ShoppingCartDTO;
import com.sky.entity.ShoppingCart;

import java.util.List;

public interface ShoppingCartService {

    ShoppingCart add(ShoppingCartDTO shoppingCartDTO);

    ShoppingCart sub(ShoppingCartDTO shoppingCartDTO);

    List<ShoppingCart> list();

    void clean();
}
