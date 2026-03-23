package com.sky.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sky.entity.Orders;
import com.sky.mapper.OrdersMapper;
import com.sky.service.OrderReminderService;
import com.sky.websocket.AdminWebSocketServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
public class OrderReminderServiceImpl implements OrderReminderService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private OrdersMapper ordersMapper;

    @Override
    public void notifyPaidOrder(Orders orders) {
        // 新支付订单推送给管理端，用于触发待接单提醒和工作台更新。
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "new_order");
        payload.put("orderId", orders.getId());
        payload.put("orderNumber", orders.getNumber());
        payload.put("status", orders.getStatus());
        payload.put("toBeConfirmedOrders", safeCount(ordersMapper.countByCondition(Orders.TO_BE_CONFIRMED, null, null, null)));
        payload.put("serverTime", LocalDateTime.now().format(FORMATTER));
        payload.put("onlineCount", AdminWebSocketServer.onlineCount());

        try {
            AdminWebSocketServer.broadcast(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize websocket reminder payload", ex);
        }
    }

    @Override
    public void notifyReminder(Orders orders) {
        // 用户催单只补充提醒类消息，不改动订单主状态。
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "order_reminder");
        payload.put("orderId", orders.getId());
        payload.put("orderNumber", orders.getNumber());
        payload.put("status", orders.getStatus());
        payload.put("serverTime", LocalDateTime.now().format(FORMATTER));
        payload.put("onlineCount", AdminWebSocketServer.onlineCount());

        try {
            AdminWebSocketServer.broadcast(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize order reminder payload", ex);
        }
    }

    private Integer safeCount(Integer value) {
        return value == null ? 0 : value;
    }
}
