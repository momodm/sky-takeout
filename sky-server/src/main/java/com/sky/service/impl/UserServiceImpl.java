package com.sky.service.impl;

import com.sky.entity.User;
import com.sky.exception.BaseException;
import com.sky.mapper.UserMapper;
import com.sky.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public User login(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BaseException("登录凭证不能为空");
        }

        // 开发阶段使用 code 直接映射为 openid，后续接入微信可在这里替换为真实换取逻辑。
        String openid = code.trim();

        User user = userMapper.getByOpenid(openid);
        if (user != null) {
            return user;
        }

        user = User.builder()
                .openid(openid)
                .createTime(LocalDateTime.now())
                .build();
        try {
            userMapper.insert(user);
            return user;
        } catch (DuplicateKeyException ex) {
            User existingUser = userMapper.getByOpenid(openid);
            if (existingUser != null) {
                return existingUser;
            }
            throw ex;
        }
    }

    @Override
    public User getById(Long id) {
        User user = userMapper.getById(id);
        if (user == null) {
            throw new BaseException("用户不存在");
        }
        return user;
    }
}
