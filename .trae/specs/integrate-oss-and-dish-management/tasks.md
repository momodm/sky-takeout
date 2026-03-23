# Tasks

- [x] Task 1: 集成阿里云 OSS 环境
  - [x] SubTask 1.1: 在 `sky-common` 的 `pom.xml` 中引入阿里云 OSS SDK 依赖
  - [x] SubTask 1.2: 在 `sky-common` 中创建 `AliyunOssProperties` 配置属性类
  - [x] SubTask 1.3: 在 `sky-common` 中创建 `AliyunOssUtil` 工具类，实现上传功能
  - [x] SubTask 1.4: 在 `sky-server` 的 `application.yml` 中配置 OSS 参数（使用占位符或示例值）
  - [x] SubTask 1.5: 在 `sky-server` 的 `config` 包下创建 `OssConfiguration` 配置类，初始化 `AliyunOssUtil` Bean

- [x] Task 2: 实现通用文件上传接口
  - [x] SubTask 2.1: 在 `sky-server` 中创建 `CommonController`
  - [x] SubTask 2.2: 实现 `/admin/common/upload` 接口逻辑，记录上传日志并返回 URL

- [x] Task 3: 准备菜品相关数据模型
  - [x] SubTask 3.1: 在 `sky-pojo` 中定义 `DishDTO`（包含口味列表）
  - [x] SubTask 3.2: 在 `sky-pojo` 中定义 `DishVO`（后续查询使用）
  - [x] SubTask 3.3: 在 `sky-pojo` 中定义 `DishFlavor` 实体类

- [x] Task 4: 实现新增菜品业务逻辑
  - [x] SubTask 4.1: 创建 `DishController` 并 define `save` 方法
  - [x] SubTask 4.2: 创建 `DishService` 接口及其实现类 `DishServiceImpl`
  - [x] SubTask 4.3: 在 `DishServiceImpl.save` 中实现业务逻辑：
    - 向 `dish` 表插入 1 条数据
    - 向 `dish_flavor` 表插入 n 条数据（需处理菜品 ID 关联）
    - 添加 `@Transactional` 注解保证事务一致性
  - [x] SubTask 4.4: 创建 `DishMapper` 接口，定义 `insert` 方法并获取自增主键
  - [x] SubTask 4.5: 创建 `DishFlavorMapper` 接口，定义批量插入方法 `insertBatch`

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 4] depends on [Task 1] (需要图片 URL)
