# Apifox 测试范围（对齐当前正式前端）

## 适用对象

本清单对应当前正式前端：

- 目录：`E:\sky\sky-web`
- 技术栈：`React + Vite + TypeScript`
- 页面入口：
  - `/customer/*`
  - `/console/*`

本清单不按“后端全量接口”编写，而是只覆盖当前前端真实会调用的接口。

## 环境配置

建议在 Apifox 中建立两套环境。

### 1. backend-direct

- `adminBaseUrl = http://127.0.0.1:8080/admin`
- `userBaseUrl = http://127.0.0.1:8080/user`

### 2. nginx-proxy

- `adminProxyUrl = http://127.0.0.1/api/admin`
- `userProxyUrl = http://127.0.0.1/api/user`

## 鉴权变量

- `adminToken`
- `userToken`

请求头约定：

- 后台接口：`token: {{adminToken}}`
- 顾客接口：`authentication: {{userToken}}`

## 取 Token 的前置接口

### 后台端

- `POST /admin/employee/login`

请求体示例：

```json
{
  "username": "admin",
  "password": "123456"
}
```

### 顾客端

- `POST /user/user/login`

请求体示例：

```json
{
  "code": "apifox-mock-code"
}
```

## 顾客端接口清单

### 登录与会话

- `POST /user/user/login`
- `GET /user/user/current`
- `GET /user/shop/status`

### 点餐

- `GET /user/category/list`
- `GET /user/dish/list`
- `GET /user/setmeal/list`

### 购物车

- `GET /user/shoppingCart/list`
- `POST /user/shoppingCart/add`
- `POST /user/shoppingCart/sub`
- `DELETE /user/shoppingCart/clean`

### 地址簿

- `GET /user/addressBook/list`
- `GET /user/addressBook/default`
- `GET /user/addressBook/{id}`
- `POST /user/addressBook`
- `PUT /user/addressBook`
- `PUT /user/addressBook/default`
- `DELETE /user/addressBook`

### 订单

- `POST /user/order/submit`
- `GET /user/order/historyOrders`
- `GET /user/order/orderDetail/{id}`
- `PUT /user/order/payment/{id}`
- `PUT /user/order/reminder/{id}`
- `PUT /user/order/cancel/{id}`
- `PUT /user/order/repetition/{id}`

## 后台端接口清单

### 登录与员工

- `POST /admin/employee/login`
- `GET /admin/employee/page`
- `POST /admin/employee`
- `PUT /admin/employee`
- `POST /admin/employee/status/{status}`

### 分类

- `GET /admin/category/page`
- `GET /admin/category/list`
- `POST /admin/category`
- `PUT /admin/category`
- `DELETE /admin/category`
- `POST /admin/category/status/{status}`

### 菜品

- `GET /admin/dish/page`
- `GET /admin/dish/{id}`
- `POST /admin/dish`
- `PUT /admin/dish`
- `DELETE /admin/dish`
- `POST /admin/dish/status/{status}`

### 套餐

- `GET /admin/setmeal/page`
- `GET /admin/setmeal/{id}`
- `POST /admin/setmeal`
- `PUT /admin/setmeal`
- `DELETE /admin/setmeal`
- `POST /admin/setmeal/status/{status}`

### 店铺

- `GET /admin/shop/status`
- `PUT /admin/shop/{status}`

### 工作台与订单

- `GET /admin/workspace/overview`
- `GET /admin/workspace/realtime`
- `GET /admin/workspace/orderStatistics`
- `GET /admin/order/conditionSearch`
- `GET /admin/order/details/{id}`
- `PUT /admin/order/confirm`
- `PUT /admin/order/rejection`
- `PUT /admin/order/cancel`
- `PUT /admin/order/delivery/{id}`
- `PUT /admin/order/complete/{id}`

### 上传与报表

- `POST /admin/common/upload`
- `GET /admin/report/turnoverStatistics`
- `GET /admin/report/userStatistics`
- `GET /admin/report/ordersStatistics`
- `GET /admin/report/top10`
- `GET /admin/report/export`

## 推荐测试顺序

### 顾客端最小闭环

1. 顾客登录
2. 查询当前用户
3. 查询营业状态
4. 查询分类
5. 查询菜品
6. 加入购物车
7. 查询默认地址
8. 如无默认地址，新增地址并设为默认
9. 提交订单
10. 查询历史订单
11. 支付订单

### 后台端最小闭环

1. 管理员登录
2. 查询工作台概览
3. 查询工作台实时态势
4. 条件查询订单
5. 查询订单详情
6. 接单
7. 派送
8. 完成

## 关键异常场景

### 顾客端

- 不带 `authentication` 访问顾客接口，应返回鉴权失败
- 无默认地址时提交订单，应返回业务失败
- 店铺打烊时提交订单，应返回业务失败

### 后台端

- 不带 `token` 访问后台接口，应返回鉴权失败
- 上传接口失败时，应记录状态码与响应体
- 报表导出失败时，应确认是权限问题还是文件流问题

## 交付要求

测试结束后建议至少保留以下材料：

- Apifox 环境配置截图
- Token 获取成功截图
- 顾客端闭环成功记录
- 后台端闭环成功记录
- 异常场景至少 2 条失败样例
- 测试报告或测试集合执行结果导出

## 最终建议

Apifox 的测试对象默认继续以当前 `sky-web` 对接的接口为准。

如果后续要测试候选 Vue 管理后台，应单独新增一个“legacy-admin-candidate”测试项目，不要与当前正式前端混用同一份验收口径。
