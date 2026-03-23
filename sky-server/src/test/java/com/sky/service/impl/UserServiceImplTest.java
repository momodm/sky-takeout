package com.sky.service.impl;

import com.sky.entity.User;
import com.sky.exception.BaseException;
import com.sky.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void loginShouldCreateUserWhenOpenidNotExists() {
        when(userMapper.getByOpenid("demo-code")).thenReturn(null);
        doAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return null;
        }).when(userMapper).insert(org.mockito.ArgumentMatchers.any(User.class));

        User user = userService.login("demo-code");

        assertEquals(1L, user.getId());
        assertEquals("demo-code", user.getOpenid());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(captor.capture());
        assertNotNull(captor.getValue().getCreateTime());
    }

    @Test
    void loginShouldReuseExistingUser() {
        User existing = User.builder().id(2L).openid("demo-code").build();
        when(userMapper.getByOpenid("demo-code")).thenReturn(existing);

        User user = userService.login("demo-code");

        assertEquals(2L, user.getId());
        assertEquals("demo-code", user.getOpenid());
    }

    @Test
    void loginShouldRejectBlankCode() {
        BaseException ex = assertThrows(BaseException.class, () -> userService.login(" "));

        assertEquals("登录凭证不能为空", ex.getMessage());
    }
}
