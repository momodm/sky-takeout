# Sky Web End-to-End Checklist

这份清单对应前端双入口的最终联调交付。

## 启动顺序

1. MySQL
2. Redis
3. `sky-server` 后端，默认 `http://127.0.0.1:8080`
4. Nginx，默认 `http://127.0.0.1`

## 前端入口

- 顾客端：`http://127.0.0.1/customer/`
- 后台端：`http://127.0.0.1/console/`

## 一键验收脚本

```powershell
cd E:\sky
.\scripts\sky_web_end_to_end_acceptance.ps1
```

## 脚本会验证什么

- 后端 `8080`、Redis `6379`、Nginx `80` 是否可达
- `doc.html`、`/customer/`、`/console/` 是否返回 `200`
- 顾客 mock 登录是否成功
- 后台管理员登录是否成功
- 店铺是否能切到营业中
- 顾客是否能完成：
  - 清空购物车
  - 加菜
  - 提交订单
  - mock 支付
- 后台是否能完成：
  - 接单
  - 派送
  - 完成订单
- 工作台和报表接口是否还能正常返回

## 通过标准

- 脚本不抛错
- 最终输出 JSON 中：
  - `customerEntryOk = true`
  - `consoleEntryOk = true`
  - `docEntryOk = true`
  - `finalStatus = 5`
  - `finalPayStatus = 1`

## 补充说明

- 这份脚本验证的是“完整演示和联调可交付”，不是正式生产支付。
- 顾客端仍然使用当前 mock 登录策略。
- 如果脚本失败，优先检查服务是否都已经启动。
