package com.sky.mapper;

import com.sky.entity.AddressBook;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AddressBookMapper {

    @Insert("insert into address_book (user_id, consignee, sex, phone, province_code, province_name, city_code, city_name, district_code, district_name, detail, label, is_default) " +
            "values (#{userId}, #{consignee}, #{sex}, #{phone}, #{provinceCode}, #{provinceName}, #{cityCode}, #{cityName}, #{districtCode}, #{districtName}, #{detail}, #{label}, #{isDefault})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(AddressBook addressBook);

    List<AddressBook> list(AddressBook addressBook);

    @Select("select * from address_book where id = #{id} and user_id = #{userId}")
    AddressBook getByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Update("update address_book set consignee = #{consignee}, sex = #{sex}, phone = #{phone}, province_code = #{provinceCode}, province_name = #{provinceName}, city_code = #{cityCode}, city_name = #{cityName}, district_code = #{districtCode}, district_name = #{districtName}, detail = #{detail}, label = #{label}, is_default = #{isDefault} where id = #{id} and user_id = #{userId}")
    void update(AddressBook addressBook);

    @Delete("delete from address_book where id = #{id} and user_id = #{userId}")
    void deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Update("update address_book set is_default = 0 where user_id = #{userId}")
    void clearDefaultByUserId(Long userId);

    @Select("select * from address_book where user_id = #{userId} and is_default = 1 limit 1")
    AddressBook getDefaultByUserId(Long userId);
}
