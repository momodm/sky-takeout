# Checklist

- [ ] `DishController.page` 接口返回的分页结果包含 `categoryName` 字段。
- [ ] 批量删除起售中菜品时，后端抛出 `BaseException`，提示“起售中的菜品不能删除”。
- [ ] 批量删除被套餐关联的菜品时，后端抛出 `BaseException`，提示“当前菜品关联了套餐，不能删除”。
- [ ] 删除菜品后，对应 `dish_flavor` 表中的相关口味记录已物理移除。
- [ ] `DishController.getById` 能够正确返回菜品基本信息及其关联的所有口味列表。
- [ ] 修改菜品基础信息（如价格、描述）后，数据库记录已更新。
- [ ] 修改菜品口味（如删除一种口味、新增一种口味）后，`dish_flavor` 表中旧记录已清除，新记录已保存且关联正确。
- [ ] 新增套餐功能测试通过，`setmeal` 和 `setmeal_dish` 表数据记录对应正确且事务控制生效。
- [ ] 所有的 INSERT/UPDATE 操作均已通过 `@AutoFill` 自动填充审计字段。
