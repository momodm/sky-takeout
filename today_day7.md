# Day 7 今日工作单
日期：2026-03-21
阶段：第 3 阶段，用户端与下单核心
今日主题：文档调试优化 + 用户端商品浏览 + 用户身份基础链路 + 购物车基础闭环 + 地址簿闭环 + 订单主链路 + 订单状态流转 + 支付回写与订单统计
状态：已完成第六批

## 今日已完成
### A. 文档调试体验
- [x] Knife4j 增加统一 `token` 授权输入
- [x] 管理端接口已挂上统一安全定义

### B. 用户端商品浏览
- [x] `GET /user/category/list`
- [x] `GET /user/dish/list`
- [x] `GET /user/setmeal/list`

### C. 用户身份基础链路
- [x] 新增 `user` 表
- [x] 新增 `POST /user/user/login`
- [x] 新增 `GET /user/user/current`
- [x] 新增用户端 JWT 拦截器
- [x] 用户端请求头统一使用 `authentication`

### D. 购物车基础闭环
- [x] 新增 `shopping_cart` 表
- [x] 新增 `POST /user/shoppingCart/add`
- [x] 新增 `POST /user/shoppingCart/sub`
- [x] 新增 `GET /user/shoppingCart/list`
- [x] 新增 `DELETE /user/shoppingCart/clean`

### E. 地址簿闭环
- [x] 新增 `address_book` 表
- [x] 新增 `POST /user/addressBook`
- [x] 新增 `GET /user/addressBook/list`
- [x] 新增 `GET /user/addressBook/{id}`
- [x] 新增 `PUT /user/addressBook`
- [x] 新增 `DELETE /user/addressBook?id=...`
- [x] 新增 `PUT /user/addressBook/default`
- [x] 新增 `GET /user/addressBook/default`

### F. 订单主链路
- [x] 新增 `orders` 表
- [x] 新增 `order_detail` 表
- [x] 新增 `POST /user/order/submit`
- [x] 新增 `GET /user/order/historyOrders`
- [x] 新增 `GET /user/order/orderDetail/{id}`
- [x] 新增 `PUT /user/order/repetition/{id}`

### G. 订单状态流转
- [x] 新增 `PUT /user/order/cancel/{id}`
- [x] 新增 `GET /admin/order/conditionSearch`
- [x] 新增 `GET /admin/order/details/{id}`
- [x] 新增 `PUT /admin/order/confirm`
- [x] 新增 `PUT /admin/order/rejection`
- [x] 新增 `PUT /admin/order/cancel`
- [x] 新增 `PUT /admin/order/delivery/{id}`
- [x] 新增 `PUT /admin/order/complete/{id}`

### H. 支付回写与统计
- [x] 新增 `PUT /user/order/payment/{id}`
- [x] 新增 `GET /admin/workspace/orderStatistics`
- [x] 支付成功后订单状态回写为“待接单”
- [x] 管理端可查看订单总量、待接单、已支付、未支付、营业额等统计

## 已完成验证
- `./mvnw -q -pl sky-server -am test` 通过
- 用户端登录、商品浏览、购物车、地址簿、提交订单链路正常
- 用户取消订单联调成功，取消后订单状态为 `6`
- 管理端订单条件查询、订单详情联调成功
- 管理端接单 -> 派送 -> 完成联调成功，最终订单状态为 `5`
- 管理端拒单联调成功，订单状态为 `6`
- 管理端取消订单联调成功，订单状态为 `6`
- 提交订单后模拟支付成功联调成功：
  - 订单状态变为 `2`
  - 支付状态变为 `1`
  - `checkoutTime` 正常回写
- 管理端订单统计联调成功：
  - `totalOrders`、`toBeConfirmedOrders`、`paidOrders`、`unpaidOrders` 已返回
- 支付后的接单链路仍然正常，接单后状态变为 `3`

## 今日新增/修改重点
- `sky-pojo/src/main/java/com/sky/dto/OrdersPageQueryDTO.java`
- `sky-pojo/src/main/java/com/sky/vo/OrderStatisticsVO.java`
- `sky-server/src/main/java/com/sky/controller/admin/OrderController.java`
- `sky-server/src/main/java/com/sky/controller/admin/WorkspaceController.java`
- `sky-server/src/main/java/com/sky/controller/user/OrderController.java`
- `sky-server/src/main/java/com/sky/mapper/OrdersMapper.java`
- `sky-server/src/main/resources/mapper/OrdersMapper.xml`
- `sky-server/src/main/java/com/sky/service/OrderService.java`
- `sky-server/src/main/java/com/sky/service/WorkspaceService.java`
- `sky-server/src/main/java/com/sky/service/impl/OrderServiceImpl.java`
- `sky-server/src/main/java/com/sky/service/impl/WorkspaceServiceImpl.java`
- `sky-server/src/test/java/com/sky/service/impl/OrderServiceImplTest.java`
- `sky-server/src/test/java/com/sky/service/impl/WorkspaceServiceImplTest.java`

## 当前运行状态
- 后端运行中：`8080`
- Redis 运行中：`6379`

## 剩余缺口
- 催单、再支付保护、支付超时自动取消等还未开始
- 工作台更多统计项和 WebSocket 来单提醒还未开始
- 如果继续下一轮，建议优先补来单提醒和更多工作台统计
