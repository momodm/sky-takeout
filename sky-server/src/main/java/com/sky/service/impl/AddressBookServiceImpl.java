package com.sky.service.impl;

import com.sky.context.BaseContext;
import com.sky.entity.AddressBook;
import com.sky.exception.BaseException;
import com.sky.mapper.AddressBookMapper;
import com.sky.service.AddressBookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddressBookServiceImpl implements AddressBookService {

    @Autowired
    private AddressBookMapper addressBookMapper;

    @Override
    public AddressBook save(AddressBook addressBook) {
        Long userId = getCurrentUserId();
        addressBook.setUserId(userId);
        if (addressBook.getIsDefault() != null && addressBook.getIsDefault() == 1) {
            // 同一用户只能保留一个默认地址，新默认地址落库前先清空旧标记。
            addressBookMapper.clearDefaultByUserId(userId);
        } else {
            addressBook.setIsDefault(0);
        }
        addressBookMapper.insert(addressBook);
        return addressBook;
    }

    @Override
    public List<AddressBook> list() {
        return addressBookMapper.list(AddressBook.builder().userId(getCurrentUserId()).build());
    }

    @Override
    public AddressBook getById(Long id) {
        AddressBook addressBook = addressBookMapper.getByIdAndUserId(id, getCurrentUserId());
        if (addressBook == null) {
            throw new BaseException("地址不存在");
        }
        return addressBook;
    }

    @Override
    public AddressBook getDefault() {
        return addressBookMapper.getDefaultByUserId(getCurrentUserId());
    }

    @Override
    public AddressBook setDefault(Long id) {
        Long userId = getCurrentUserId();
        AddressBook addressBook = addressBookMapper.getByIdAndUserId(id, userId);
        if (addressBook == null) {
            throw new BaseException("地址不存在");
        }
        // 切换默认地址时先撤销旧默认项，再把目标地址置为默认。
        addressBookMapper.clearDefaultByUserId(userId);
        addressBook.setIsDefault(1);
        addressBookMapper.update(addressBook);
        return addressBookMapper.getDefaultByUserId(userId);
    }

    @Override
    public void update(AddressBook addressBook) {
        Long userId = getCurrentUserId();
        AddressBook existing = addressBookMapper.getByIdAndUserId(addressBook.getId(), userId);
        if (existing == null) {
            throw new BaseException("地址不存在");
        }
        addressBook.setUserId(userId);
        if (addressBook.getIsDefault() != null && addressBook.getIsDefault() == 1) {
            // 编辑时如果显式设置为默认地址，也要同步清空其他地址的默认标记。
            addressBookMapper.clearDefaultByUserId(userId);
        } else if (addressBook.getIsDefault() == null) {
            // 前端未传默认标记时沿用旧值，避免普通编辑误改默认状态。
            addressBook.setIsDefault(existing.getIsDefault());
        }
        addressBookMapper.update(addressBook);
    }

    @Override
    public void deleteById(Long id) {
        Long userId = getCurrentUserId();
        AddressBook existing = addressBookMapper.getByIdAndUserId(id, userId);
        if (existing == null) {
            throw new BaseException("地址不存在");
        }
        addressBookMapper.deleteByIdAndUserId(id, userId);
    }

    private Long getCurrentUserId() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new BaseException("用户未登录");
        }
        return userId;
    }
}
