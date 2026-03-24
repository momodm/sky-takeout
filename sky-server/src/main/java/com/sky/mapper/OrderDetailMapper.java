package com.sky.mapper;

import com.sky.entity.OrderDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface OrderDetailMapper {

    void insertBatch(List<OrderDetail> orderDetails);

    @Select("select * from order_detail where order_id = #{orderId} order by id asc")
    List<OrderDetail> getByOrderId(Long orderId);

    List<com.sky.vo.GoodsSalesVO> getSalesTop10(@Param("beginTime") java.time.LocalDateTime beginTime,
                                                @Param("endTime") java.time.LocalDateTime endTime);
}
