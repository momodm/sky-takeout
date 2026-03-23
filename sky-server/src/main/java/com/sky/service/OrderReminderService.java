package com.sky.service;

import com.sky.entity.Orders;

public interface OrderReminderService {

    void notifyPaidOrder(Orders orders);

    void notifyReminder(Orders orders);
}
