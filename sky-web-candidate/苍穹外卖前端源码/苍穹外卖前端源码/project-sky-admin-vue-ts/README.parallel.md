# 苍穹外卖后台候选版

这份项目是旧的 Vue2 管理后台，只作为“可并行运行的后台候选版”保留，
不替换当前正式前端 [E:\sky\sky-web](/E:/sky/sky-web)。

## 运行定位

- 正式前端主线：`E:\sky\sky-web`
- 后台候选版：当前目录
- 后端接口：`http://127.0.0.1:8080/admin`
- WebSocket：`ws://127.0.0.1:8080/ws/admin/orders`
- 开发入口：`http://127.0.0.1:8889`
- 生产构建目录：`dist-legacy-console`
- 生产基础路径：`/legacy-console/`

## 推荐 Node 版本

这份 Vue CLI 3 项目更适合 Node 16。

- 推荐版本：`16.20.2`
- 本机可直接使用：`E:\sky\tools\node-v16.20.2-win-x64`

## 首次安装

先清理旧的依赖目录：

```powershell
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
```

再使用 Node 16 安装依赖：

```powershell
$env:PATH='E:\sky\tools\node-v16.20.2-win-x64;' + $env:PATH
& 'E:\sky\tools\node-v16.20.2-win-x64\npm.cmd' install --legacy-peer-deps --registry=https://registry.npmjs.org/ --fetch-timeout=300000 --fetch-retries=5 --maxsockets=1 --no-audit --no-fund
```

## 开发运行

```powershell
$env:PATH='E:\sky\tools\node-v16.20.2-win-x64;' + $env:PATH
& 'E:\sky\tools\node-v16.20.2-win-x64\npm.cmd' run serve:parallel
```

如果控制台提示 `8888` 被占用，这是正常的。本机当前候选版固定使用 `8889`。

## 构建

```powershell
$env:PATH='E:\sky\tools\node-v16.20.2-win-x64;' + $env:PATH
& 'E:\sky\tools\node-v16.20.2-win-x64\npm.cmd' run build:parallel
```

## 已做适配

- 并行开发端口固定为 `8889`
- 生产构建输出到 `dist-legacy-console`
- 生产访问基础路径固定为 `/legacy-console/`
- 保持 `/api -> /admin` 的代理方式，适配当前后端
- 工作台首页已经改接当前后端的：
  - `/workspace/overview`
  - `/workspace/realtime`
  - `/workspace/orderStatistics`
- 报表页继续使用当前后端已有的：
  - `/report/turnoverStatistics`
  - `/report/userStatistics`
  - `/report/ordersStatistics`
  - `/report/top10`
  - `/report/export`

## 已知差异

- 这是旧的 Vue2 管理后台，只覆盖后台，不包含顾客端
- 部分业务页仍保留历史样式和少量旧文案，适合作为候选版并行验证，不建议替代正式 React 主线
- WebSocket 已能对接当前后端，但提醒文案和提示层仍按候选版收口，不作为正式主线交付
