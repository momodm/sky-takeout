# Day 8 验收报告

日期：2026-03-23
结论：Day 8 计划内功能已经完整落地，并且当前仓库实际进度已超过 Day 8。

## 本次收口处理

- 修复了 [OrderServiceImplTest.java](/E:/sky/sky-server/src/test/java/com/sky/service/impl/OrderServiceImplTest.java) 中 `List.of(...)` 的兼容性问题，改为 `Arrays.asList(...)`
- 停止了占用 `8080` 的运行中 Jar 进程，消除了 Spring Boot `repackage` 时的锁文件问题
- 重新完成了一轮编译、测试、打包、启动和接口冒烟

## 验收结果

- `./mvnw -q -pl sky-server -am test`：通过
- `./mvnw -q -pl sky-server -am package -DskipTests`：通过
- 后端服务启动成功：`http://127.0.0.1:8080`
- Nginx 静态页可访问：`http://127.0.0.1/`

## Day 8 功能冒烟结果

- 接口文档页 `http://127.0.0.1:8080/doc.html` 返回 `200`
- 后台首页 `http://127.0.0.1/` 返回 `200`
- 店铺营业状态已开启，用户端查询返回 `1`
- 用户下单成功，实测订单 `order_id=24`
- 用户催单接口调用成功，返回 `code=1`
- 同一订单二次支付被业务拦截，返回 `code=0`
- 超时未支付订单实测自动取消，订单 `id=25` 最终状态为 `6`

## 截止 Day 8 的判断

- 功能完整性：已完整
- 代码可编译性：正常
- 测试状态：全绿
- 打包状态：正常
- 运行状态：可实现并已联调验证

## 备注

- 重复支付与超时取消的响应文案在终端里有中文编码显示问题，但接口行为和数据库状态都正确
- 当前仓库还包含 Day 9 的工作台实时态势和 WebSocket 提醒能力，因此实际进度已超过 Day 8
