# Checklist

- [x] `sky-common` 已成功引入 `aliyun-sdk-oss` 依赖。
- [x] `AliyunOssUtil` 能够通过 `AliyunOssProperties` 正确初始化。
- [x] `/admin/common/upload` 接口测试通过，能够接收文件并返回 OSS 路径。
- [x] `DishDTO` 正确封装了前端传来的 JSON 数据（包含 `flavors` 数组）。
- [x] `DishMapper.insert` 执行后能够通过 `useGeneratedKeys` 获取到自增生成的 `dishId`。
- [x] `DishFlavorMapper.insertBatch` 能够将口味列表批量存入数据库。
- [x] 新增菜品功能整体测试通过，数据库中 `dish` 和 `dish_flavor` 数据对应正确。
- [x] 事务测试：模拟口味保存失败，验证菜品记录是否回滚（可选，推荐手动验证）。
