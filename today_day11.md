# Day 11 工作单

日期：2026-03-25

## 今日目标
- 为用户端热点查询接入 Redis 缓存
- 补齐缓存失效策略，保证后台改动后用户端读取不会长期脏数据
- 做一轮稳定性回归，确保 Redis 不可用时接口仍能正常降级

## 推荐顺序
1. 给分类、菜品、套餐用户端列表接入缓存
2. 在分类、菜品、套餐的后台写操作后清理对应缓存
3. 补服务层与缓存组件测试
4. 做真实接口与 Redis 冒烟验证

## 完成标准
- `/user/category/list`、`/user/dish/list`、`/user/setmeal/list` 接入缓存
- 分类、菜品、套餐后台写操作会清理对应缓存
- Redis 不可用时，用户端查询接口不返回 500
- `./mvnw -q -pl sky-server -am test` 通过

## 当前进度
- [x] 新增 `CatalogCacheService` 缓存组件
- [x] 分类、菜品、套餐用户端列表已接入缓存
- [x] 分类、菜品、套餐后台写操作已接入缓存失效
- [x] 新增缓存降级逻辑，Redis 不可用时自动回退数据库
- [x] 新增缓存相关单测
- [x] 真实接口与 Redis 冒烟已完成

## 今日验收结果
- `./mvnw -q -pl sky-server -am -DskipTests compile` 通过
- `./mvnw -q -pl sky-server -am test` 通过
- `GET /user/category/list?type=1` 返回成功
- `GET /user/dish/list?categoryId=2` 返回成功
- `GET /user/setmeal/list?categoryId=4` 返回成功
- `GET /admin/workspace/realtime` 返回成功
- `GET /admin/report/ordersStatistics?begin=2026-03-22&end=2026-03-25` 返回成功
- Redis 中已写入并成功读取 `USER_CATEGORY_LIST:1`

## 结果说明
- 用户端热点查询缓存已落地，当前缓存键前缀包括 `USER_CATEGORY_LIST:`、`USER_DISH_LIST:`、`USER_SETMEAL_LIST:`
- Redis 不在线时，缓存层会自动降级到数据库查询，不会把用户端接口打成 500
- Day 11 这轮更偏向“性能与稳定性增强”，没有改变原有接口契约
