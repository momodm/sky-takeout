# Tasks

- [ ] Task 1: 完善菜品管理功能
  - [ ] SubTask 1.1: 实现菜品分页查询 `GET /admin/dish/page`。
    - 涉及 `DishController`, `DishService.pageQuery`, `DishMapper.pageQuery`（需要多表联查 `category` 表获取分类名称）。
  - [ ] SubTask 1.2: 实现菜品起停售接口 `POST /admin/dish/status/{status}`。
  - [ ] SubTask 1.3: 实现批量删除菜品 `DELETE /admin/dish`。
    - 需先查询菜品状态及 `setmeal_dish` 表的关联关系。
    - 成功后同步删除 `dish_flavor` 数据。
  - [ ] SubTask 1.4: 实现根据 ID 查询菜品（回显数据） `GET /admin/dish/{id}`。
    - 返回 `DishVO`，包含口味列表。
  - [ ] SubTask 1.5: 实现修改菜品 `PUT /admin/dish`。
    - 业务逻辑：修改 `dish` 记录 -> 删除旧口味 -> 插入新口味。

- [ ] Task 2: 准备套餐管理相关数据模型
  - [ ] SubTask 2.1: 在 `sky-pojo` 中定义 `SetmealDTO`（包含关联菜品列表）。
  - [ ] SubTask 2.2: 在 `sky-pojo` 中定义 `SetmealVO`（后续查询使用）。
  - [ ] SubTask 2.3: 在 `sky-pojo` 中定义 `SetmealDish` 实体类。

- [ ] Task 3: 实现新增套餐业务逻辑
  - [ ] SubTask 3.1: 创建 `SetmealController` 并定义 `save` 方法。
  - [ ] SubTask 3.2: 创建 `SetmealService` 接口及其实现类 `SetmealServiceImpl`。
  - [ ] SubTask 3.3: 在 `SetmealServiceImpl.save` 中实现业务逻辑：
    - 向 `setmeal` 表插入 1 条数据。
    - 向 `setmeal_dish` 表插入 n 条数据（需处理套餐 ID 关联）。
    - 添加 `@Transactional` 注解保证事务一致性。
  - [ ] SubTask 3.4: 创建 `SetmealMapper` 接口，定义 `insert` 方法并获取自增主键。
  - [ ] SubTask 3.5: 创建 `SetmealDishMapper` 接口，定义批量插入方法 `insertBatch`。

# Task Dependencies
- [Task 1.3] 依赖于 `SetmealDishMapper` (需检查关联关系)。
- [Task 3] 依赖于 [Task 2]。
