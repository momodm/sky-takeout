package com.sky.task;

import com.sky.service.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
public class OrderTimeoutTask {

    private static final long TIMEOUT_MINUTES = 15L;

    @Autowired
    private OrderService orderService;

    @Scheduled(fixedDelay = 60000)
    public void cancelTimedOutOrders() {
        // 每分钟扫描一次超时未支付订单，及时把无效订单关闭掉。
        int affected = orderService.cancelTimedOutOrders(LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES));
        if (affected > 0) {
            log.info("Auto cancelled {} timed out orders", affected);
        }
    }
}
