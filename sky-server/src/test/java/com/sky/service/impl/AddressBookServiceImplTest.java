package com.sky.service.impl;

import com.sky.context.BaseContext;
import com.sky.entity.AddressBook;
import com.sky.exception.BaseException;
import com.sky.mapper.AddressBookMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressBookServiceImplTest {

    @Mock
    private AddressBookMapper addressBookMapper;

    @InjectMocks
    private AddressBookServiceImpl addressBookService;

    @AfterEach
    void tearDown() {
        BaseContext.removeCurrentId();
    }

    @Test
    void saveShouldBindCurrentUserAndInsert() {
        BaseContext.setCurrentId(6L);
        doAnswer(invocation -> {
            AddressBook addressBook = invocation.getArgument(0);
            addressBook.setId(1L);
            return null;
        }).when(addressBookMapper).insert(any(AddressBook.class));

        AddressBook addressBook = addressBookService.save(AddressBook.builder()
                .consignee("张三")
                .phone("13800000000")
                .isDefault(1)
                .build());

        assertEquals(1L, addressBook.getId());
        assertEquals(6L, addressBook.getUserId());
        verify(addressBookMapper).clearDefaultByUserId(6L);
    }

    @Test
    void setDefaultShouldSwitchDefaultAddress() {
        BaseContext.setCurrentId(6L);
        AddressBook existing = AddressBook.builder().id(2L).userId(6L).isDefault(0).build();
        AddressBook expected = AddressBook.builder().id(2L).userId(6L).isDefault(1).build();
        when(addressBookMapper.getByIdAndUserId(2L, 6L)).thenReturn(existing);
        when(addressBookMapper.getDefaultByUserId(6L)).thenReturn(expected);

        AddressBook addressBook = addressBookService.setDefault(2L);

        assertEquals(1, addressBook.getIsDefault());
        verify(addressBookMapper).clearDefaultByUserId(6L);
        verify(addressBookMapper).update(existing);
    }

    @Test
    void updateShouldRejectAddressFromOtherUser() {
        BaseContext.setCurrentId(6L);
        when(addressBookMapper.getByIdAndUserId(3L, 6L)).thenReturn(null);

        BaseException ex = assertThrows(BaseException.class, () -> addressBookService.update(AddressBook.builder()
                .id(3L)
                .consignee("李四")
                .build()));

        assertEquals("地址不存在", ex.getMessage());
        verify(addressBookMapper, never()).update(any(AddressBook.class));
    }
}
