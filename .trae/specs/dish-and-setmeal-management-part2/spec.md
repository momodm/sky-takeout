# 菜品管理（下）与套餐管理（上） Spec

## Why
在完成菜品新增功能后，需要进一步完善菜品的维护功能（查询、修改、删除、状态控制），并开启套餐管理模块，实现套餐的基本新增逻辑，为后续 C 端展示打下基础。

## What Changes
- **菜品分页查询**: 实现 `GET /admin/dish/page`，支持按名称、分类、状态筛选。
- **批量删除菜品**: 实现 `DELETE /admin/dish`，需满足：
    - 售卖中的菜品不能删除。
    - 被套餐关联的菜品不能删除。
    - 删除菜品时需同步删除关联的口味数据。
- **修改菜品**: 
    - 实现 `GET /admin/dish/{id}`：回显菜品及其口味。
    - 实现 `PUT /admin/dish`：修改基础信息并更新口味（采用先删后增策略）。
- **菜品起停售**: 实现 `POST /admin/dish/status/{status}`。
- **新增套餐**: 
    - 实现 `POST /admin/setmeal`，涉及 `setmeal` 表和 `setmeal_dish` 关系表。
    - 需要在 `sky-pojo` 定义 `SetmealDTO`。

## Impact
- 涉及模块：`sky-server` (业务逻辑), `sky-pojo` (数据模型)。
- 关键文件：`DishController`, `DishService`, `DishMapper`, `DishFlavorMapper`, `SetmealController`, `SetmealService`, `SetmealMapper`, `SetmealDishMapper`。
- **BREAKING**: 删除菜品操作会物理删除 `dish` 和 `dish_flavor` 表的数据。

## ADDED Requirements
### Requirement: 菜品删除约束
系统在删除菜品前必须检查其状态和关联关系。

#### Scenario: 成功删除未关联且停售的菜品
- **WHEN** 用户选择一个或多个处于“停售”状态且未被任何套餐引用的菜品进行删除
- **THEN** 系统从 `dish` 和 `dish_flavor` 表中移除相关记录，返回 `code: 1`。

#### Scenario: 删除正在售卖的菜品失败
- **WHEN** 用户尝试删除一个状态为“起售”的菜品
- **THEN** 系统抛出业务异常，提示“起售中的菜品不能删除”，返回 `code: 0`。

### Requirement: 新增套餐
系统应支持保存套餐信息及其包含的菜品列表。

#### Scenario: 成功保存套餐
- **WHEN** 用户提供套餐基本信息及关联菜品 ID 和份数
- **THEN** 系统在 `setmeal` 和 `setmeal_dish` 表中创建记录。

## MODIFIED Requirements
无。

## REMOVED Requirements
无。
