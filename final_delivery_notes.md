# 苍穹外卖项目交付说明

更新日期：2026-03-27

## 当前交付范围

- 后端模块已完成：
  - 管理端员工、分类、菜品、套餐、店铺状态、订单、工作台、报表
  - 用户端登录、商品浏览、购物车、地址簿、下单、支付、催单、取消、历史订单
  - WebSocket 来单提醒、工作台实时统计、报表导出、热点查询缓存
- 前端模块已完成：
  - React + Vite + TypeScript 双入口工程 `sky-web`
  - 顾客端 `/customer/*`
  - 后台端 `/console/*`
  - 顾客端 mock 登录、点餐、购物车、地址簿、订单中心闭环
  - 后台端工作台、订单、分类、菜品、套餐、店铺状态、报表、员工管理
- 交付层已完成：
  - Nginx 双入口代理
  - 前端构建输出落盘
  - 端到端验收脚本

## 本地运行要点

### 1. 依赖服务

- MySQL：`sky_take_out`
- Redis：`127.0.0.1:6379`
- 后端：`http://127.0.0.1:8080`
- Nginx：`http://127.0.0.1`

### 2. 常用入口

- 接口文档：[http://127.0.0.1:8080/doc.html](http://127.0.0.1:8080/doc.html)
- 顾客端：[http://127.0.0.1/customer/](http://127.0.0.1/customer/)
- 后台端：[http://127.0.0.1/console/](http://127.0.0.1/console/)
- 旧静态工作台：[http://127.0.0.1/index.html](http://127.0.0.1/index.html)
- 旧静态监控页：[http://127.0.0.1/ws-monitor.html](http://127.0.0.1/ws-monitor.html)
- 旧静态报表页：[http://127.0.0.1/report-center.html](http://127.0.0.1/report-center.html)

### 3. 默认管理端账号

- 用户名：`admin`
- 密码：`123456`

## 工程检查

### 1. 后端

```powershell
./mvnw -q -pl sky-server -am test
./mvnw -q -pl sky-server -am -DskipTests compile
```

### 2. 前端

```powershell
cd .\sky-web
npm run lint
npm run build
```

## 回归与验收

### 1. Day 12 最终回归脚本

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\day12_final_regression.ps1
```

覆盖内容：

- 管理端登录
- 用户登录
- 默认地址补齐
- 购物车清空与加菜
- 提交订单
- 模拟支付
- 管理端接单、派送、完成
- 历史订单、工作台实时态势、报表接口验证

### 2. Sky Web 双入口端到端验收

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sky_web_end_to_end_acceptance.ps1
```

覆盖内容：

- `doc.html`、`/customer/`、`/console/` 可访问
- 顾客 mock 登录成功
- 顾客加菜、提交订单、支付成功
- 后台接单、派送、完成成功
- 工作台与报表接口可正常返回

通过标准：

- `customerEntryOk = true`
- `consoleEntryOk = true`
- `docEntryOk = true`
- `finalStatus = 5`
- `finalPayStatus = 1`

## 当前补充说明

- 用户端分类、菜品、套餐列表已接入 Redis 缓存
- Redis 不在线时，缓存层会自动降级到数据库查询，不会把用户端接口直接打成 500
- 前端默认真实接口优先；只有工作台、报表等适合演示的场景，才会在真实接口不可用时退回演示态，并明确提示
- 代码中仍有少量可继续统一的历史文案，但不影响主功能运行和当前交付
