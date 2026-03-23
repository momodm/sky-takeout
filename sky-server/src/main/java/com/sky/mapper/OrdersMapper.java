package com.sky.mapper;

import com.github.pagehelper.Page;
import com.sky.dto.OrdersPageQueryDTO;
import com.sky.entity.Orders;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrdersMapper {

    @Insert("insert into orders (number, status, user_id, address_book_id, order_time, checkout_time, pay_method, pay_status, amount, remark, phone, address, consignee, cancel_reason, rejection_reason, cancel_time, estimated_delivery_time, delivery_status, delivery_time, pack_amount, tableware_number) " +
            "values (#{number}, #{status}, #{userId}, #{addressBookId}, #{orderTime}, #{checkoutTime}, #{payMethod}, #{payStatus}, #{amount}, #{remark}, #{phone}, #{address}, #{consignee}, #{cancelReason}, #{rejectionReason}, #{cancelTime}, #{estimatedDeliveryTime}, #{deliveryStatus}, #{deliveryTime}, #{packAmount}, #{tablewareNumber})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Orders orders);

    Page<Orders> pageQuery(@Param("userId") Long userId, @Param("status") Integer status);

    @Select("select * from orders where id = #{id} and user_id = #{userId}")
    Orders getByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Select("select * from orders where id = #{id}")
    Orders getById(Long id);

    Page<Orders> pageQueryAdmin(OrdersPageQueryDTO ordersPageQueryDTO);

    void update(Orders orders);

    Integer countByCondition(@Param("status") Integer status, @Param("payStatus") Integer payStatus,
                             @Param("beginTime") LocalDateTime beginTime, @Param("endTime") LocalDateTime endTime);

    BigDecimal sumAmountByCondition(@Param("status") Integer status, @Param("payStatus") Integer payStatus,
                                    @Param("beginTime") LocalDateTime beginTime, @Param("endTime") LocalDateTime endTime);

    List<Orders> listTimedOutPendingOrders(@Param("cutoffTime") LocalDateTime cutoffTime);
}
