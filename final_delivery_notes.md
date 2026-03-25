# 苍穹外卖项目交付说明

更新日期：2026-03-25

## 当前交付范围

- 管理端员工、分类、菜品、套餐、店铺状态、订单、工作台、报表能力已完成
- 用户端登录、商品浏览、购物车、地址簿、下单、支付、催单、取消、历史订单已完成
- WebSocket 来单提醒、工作台实时统计、报表导出、热点查询缓存已完成
- Nginx 静态展示页、提醒监控页、报表中心页已完成

## 本地运行要点

### 1. 依赖服务
- MySQL：`sky_take_out`
- Redis：默认 `127.0.0.1:6379`
- 后端：`http://127.0.0.1:8080`
- Nginx：`http://127.0.0.1`

### 2. 常用入口
- 接口文档：[http://127.0.0.1:8080/doc.html](http://127.0.0.1:8080/doc.html)
- 工作台首页：[http://127.0.0.1/index.html](http://127.0.0.1/index.html)
- 提醒监控页：[http://127.0.0.1/ws-monitor.html](http://127.0.0.1/ws-monitor.html)
- 报表中心页：[http://127.0.0.1/report-center.html](http://127.0.0.1/report-center.html)

### 3. 默认管理端账号
- 用户名：`admin`
- 密码：`123456`

## 回归与验证

### 单测与编译
```powershell
./mvnw -q -pl sky-server -am test
./mvnw -q -pl sky-server -am -DskipTests compile
```

### 最终回归脚本
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\day12_final_regression.ps1
```

脚本覆盖内容：
- 管理端登录
- 用户登录
- 默认地址补齐
- 购物车清空与加菜
- 提交订单
- 模拟支付
- 管理端接单、派送、完成
- 历史订单、工作台实时态势、报表接口验证

## 当前补充说明

- 用户端分类、菜品、套餐列表已接入 Redis 缓存
- Redis 不在线时，缓存层会自动降级到数据库查询，不会把用户端接口直接打成 500
- 代码中仍有少量历史中文文案可以继续统一，但不影响主功能运行
