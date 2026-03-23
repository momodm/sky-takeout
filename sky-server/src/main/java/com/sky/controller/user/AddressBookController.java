package com.sky.controller.user;

import com.sky.entity.AddressBook;
import com.sky.result.Result;
import com.sky.service.AddressBookService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("userAddressBookController")
@RequestMapping("/user/addressBook")
@Api(tags = "用户端地址簿接口")
public class AddressBookController {

    @Autowired
    private AddressBookService addressBookService;

    @PostMapping
    @ApiOperation("新增地址")
    public Result<AddressBook> save(@RequestBody AddressBook addressBook) {
        return Result.success(addressBookService.save(addressBook));
    }

    @GetMapping("/list")
    @ApiOperation("查询地址列表")
    public Result<List<AddressBook>> list() {
        return Result.success(addressBookService.list());
    }

    @GetMapping("/{id}")
    @ApiOperation("根据 ID 查询地址")
    public Result<AddressBook> getById(@PathVariable Long id) {
        return Result.success(addressBookService.getById(id));
    }

    @GetMapping("/default")
    @ApiOperation("查询默认地址")
    public Result<AddressBook> getDefault() {
        return Result.success(addressBookService.getDefault());
    }

    @PutMapping("/default")
    @ApiOperation("设置默认地址")
    public Result<AddressBook> setDefault(@RequestBody AddressBook addressBook) {
        return Result.success(addressBookService.setDefault(addressBook.getId()));
    }

    @PutMapping
    @ApiOperation("修改地址")
    public Result<String> update(@RequestBody AddressBook addressBook) {
        addressBookService.update(addressBook);
        return Result.success();
    }

    @DeleteMapping
    @ApiOperation("删除地址")
    public Result<String> delete(@RequestParam Long id) {
        addressBookService.deleteById(id);
        return Result.success();
    }
}
