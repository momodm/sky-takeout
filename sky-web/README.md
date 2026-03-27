# Sky Web

`sky-web` 是苍穹外卖的新前端入口，采用 `React + Vite + TypeScript`，对外提供两套界面：

- `/customer/`：顾客端，移动端优先
- `/console/`：后台端，桌面优先

这套前端直接复用现有后端，不新增业务接口，也不改后端鉴权协议。

## 目录结构

```text
sky-web/
  src/
    customer/   顾客端页面与外壳
    console/    后台端页面与外壳
    shared/     API、鉴权、组件、文案、工具
```

## 本地启动前置

先确保这些服务已经就绪：

1. MySQL
2. Redis
3. Spring Boot 后端：`http://127.0.0.1:8080`
4. Nginx：`http://127.0.0.1`

如果后端没启动，前端会显示“服务还没准备好”的错误态，而不是直接空白。

## 开发方式

### 1. 启动后端

优先使用本机 JDK 的完整路径启动，避免 Oracle 的 `java` 路径占位程序干扰：

```powershell
& 'C:\Program Files\Java\jdk-17.0.18\bin\java.exe' -jar E:\sky\sky-server\target\sky-server-1.0-SNAPSHOT.jar --spring.profiles.active=dev
```

### 2. 启动前端开发服务

```powershell
cd E:\sky\sky-web
npm install
npm run dev
```

默认开发地址：

- `http://127.0.0.1:5173/customer/`
- `http://127.0.0.1:5173/console/`

### 3. 使用 Nginx 访问生产构建

```powershell
cd E:\sky\sky-web
npm run build
```

构建输出会写到：

- `E:\sky\nginx\html\sky-web`

Nginx 入口：

- `http://127.0.0.1/customer/`
- `http://127.0.0.1/console/`

## 代理与鉴权

Vite 和 Nginx 都使用同一套路由代理约定：

- `/api/user/*` -> `http://127.0.0.1:8080/user/*`
- `/api/admin/*` -> `http://127.0.0.1:8080/admin/*`
- `/ws/admin/orders` -> `ws://127.0.0.1:8080/ws/admin/orders`

鉴权头约定：

- 顾客端：`authentication`
- 后台端：`token`

## 当前页面范围

### 顾客端

- `/customer/` 点餐首页
- `/customer/orders` 订单中心
- `/customer/addresses` 地址簿
- `/customer/profile` 个人区

### 后台端

- `/console/workspace` 工作台
- `/console/orders` 订单中心
- `/console/categories` 分类管理
- `/console/dishes` 菜品管理
- `/console/setmeals` 套餐管理
- `/console/shop` 店铺状态
- `/console/reports` 报表中心
- `/console/employees` 员工管理

兼容路由：

- `/console/catalog` 会自动跳转到 `/console/dishes`

## 角色说明

后台不新增后端 RBAC，只做前端视图分层：

- 运营台：工作台、订单、菜品、套餐、店铺状态、报表
- 管理员：在运营台基础上额外显示分类管理、员工管理

当当前视角是“运营台”时，直接访问管理员页面会自动回到工作台。

## 验证命令

```powershell
cd E:\sky\sky-web
npm run lint
npm run build
```

## 说明

- 顾客端继续使用当前 mock 登录策略，不接微信正式登录
- 图片上传优先走 `/api/admin/common/upload`
- 如果上传接口暂时不可用，菜品和套餐页仍然支持手动填写图片 URL 作为兜底方案
