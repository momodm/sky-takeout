# Vue 后台候选版状态记录（2026-04-08）

## 结论

这份候选项目已经被改造成一套**可并行运行的后台候选版**，不会替换当前正式前端 [sky-web](/E:/sky/sky-web)。

当前可用入口：
- 候选后台开发入口：`http://127.0.0.1:8889`
- 当前后端服务：`http://127.0.0.1:8080`
- 当前提醒通道：`ws://127.0.0.1:8080/ws/admin/orders`

## 本轮关键适配

- 固定并行开发端口为 `8889`
- 生产构建输出目录改为 `dist-legacy-console`
- 保持候选后台的 `/api -> /admin` 代理方式
- 工作台首页已适配当前后端：
  - `/workspace/overview`
  - `/workspace/realtime`
  - `/workspace/orderStatistics`
- 报表页已适配当前后端：
  - `/report/turnoverStatistics`
  - `/report/userStatistics`
  - `/report/ordersStatistics`
  - `/report/top10`
  - `/report/export`
- 顶部导航已重写，支持当前后端的提醒消息类型：
  - `connection_ready`
  - `online_count_update`
  - `new_order`
  - `order_reminder`
- 工作台数据卡、订单履约概览、统计页标题条、订单状态页签已恢复为正常 UTF-8 文案

## 运行要求

- 推荐 Node：`16.20.2`
- 本机可用 Node：`E:\sky\tools\node-v16.20.2-win-x64`
- 本机运行前置：
  - MySQL 已启动
  - Redis 已启动
  - Spring Boot 后端已启动

## 已验证结果

### 构建

- `npm run build:parallel` 通过

### 页面

- `http://127.0.0.1:8889` 返回 `200`
- 页面标题为“苍穹外卖后台候选版”

### 代理与真实后端接口

以下请求均通过候选后台自己的 `8889` 代理发起并成功返回：

- `POST /api/employee/login`
- `GET /api/workspace/overview`
- `GET /api/workspace/realtime`
- `GET /api/shop/status`
- `GET /api/report/ordersStatistics`

## 当前边界

- 这份候选项目只覆盖后台，不包含顾客端
- 它适合作为并行验证和旧后台参考，不建议替换当前 React 双入口主线
- 业务页内部仍保留一部分旧样式和历史文案；如果继续打磨，优先处理订单页、统计页以及分类/菜品页
