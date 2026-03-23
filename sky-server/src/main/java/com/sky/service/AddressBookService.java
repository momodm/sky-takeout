package com.sky.service;

import com.sky.entity.AddressBook;

import java.util.List;

public interface AddressBookService {

    AddressBook save(AddressBook addressBook);

    List<AddressBook> list();

    AddressBook getById(Long id);

    AddressBook getDefault();

    AddressBook setDefault(Long id);

    void update(AddressBook addressBook);

    void deleteById(Long id);
}
