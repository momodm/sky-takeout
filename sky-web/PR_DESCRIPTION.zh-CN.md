# Sky Web 交付 PR 文案

## 标题

```text
feat: 交付 sky-web 双入口前端与端到端验收流程
```

## 概要

- 交付新的 `sky-web` React 前端工程，提供顾客端和后台端双入口
- 在不修改数据库结构和后端鉴权协议的前提下，对齐现有后端能力
- 补齐顾客下单与后台履约的端到端验收链路

## 主要改动

- 新增 `sky-web` 双入口前端：
  - `/customer/*` 作为顾客点餐入口
  - `/console/*` 作为商家运营与管理员后台入口
- 顾客端接入真实后端接口：
  - mock 登录
  - 分类、菜品、套餐浏览
  - 购物车
  - 地址簿
  - 提交订单
  - 支付、催单、取消、再来一单
- 后台端接入真实后端接口：
  - 工作台
  - 订单中心
  - 分类管理
  - 菜品管理
  - 套餐管理
  - 店铺状态
  - 报表中心
  - 员工管理
- 保留前端视角分层：
  - 运营台视图
  - 管理员视图
- 为后台 CRUD 和状态切换动作补上明确成功/失败反馈
- 保持图表按需加载，不回退到单个超大的 ECharts 包
- 增加交付文档和端到端验收脚本

## 验证方式

### 后端

```powershell
./mvnw -q -pl sky-server -am test
./mvnw -q -pl sky-server -am -DskipTests compile
```

### 前端

```powershell
cd .\sky-web
npm run lint
npm run build
```

### 运行检查

- `http://127.0.0.1:8080/doc.html`
- `http://127.0.0.1/customer/`
- `http://127.0.0.1/console/`

### 端到端验收

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sky_web_end_to_end_acceptance.ps1
```

期望结果：

- `customerEntryOk = true`
- `consoleEntryOk = true`
- `docEntryOk = true`
- `finalStatus = 5`
- `finalPayStatus = 1`

## 备注

- 后端接口和鉴权头保持不变
- 顾客端仍沿用当前 mock 登录策略
- 演示兜底只保留在工作台、报表等适合展示的场景，并且页面会明确标识当前不是实时数据
