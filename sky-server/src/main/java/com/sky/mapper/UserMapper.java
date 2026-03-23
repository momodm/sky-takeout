package com.sky.mapper;

import com.sky.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;

@Mapper
public interface UserMapper {

    @Select("select * from user where openid = #{openid}")
    User getByOpenid(String openid);

    @Select("select * from user where id = #{id}")
    User getById(Long id);

    @Insert("insert into user (openid, create_time) values (#{openid}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(User user);

    @Select({
            "<script>",
            "select count(*)",
            "from user",
            "<where>",
            "  <if test='beginTime != null'>",
            "    and create_time <![CDATA[>=]]> #{beginTime}",
            "  </if>",
            "  <if test='endTime != null'>",
            "    and create_time <![CDATA[<=]]> #{endTime}",
            "  </if>",
            "</where>",
            "</script>"
    })
    Integer countByCreateTime(@Param("beginTime") LocalDateTime beginTime, @Param("endTime") LocalDateTime endTime);
}
