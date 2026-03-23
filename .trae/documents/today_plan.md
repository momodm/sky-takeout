# 📅 今日任务计划：套餐管理（上）

根据 [dev_plan.md](file:///e:/sky/dev_plan.md) 的进度安排，今天我们将进入 **Day 5** 的核心任务：**新增套餐功能**。

## 📋 今日核心任务

1.  **数据库准备**：在数据库中创建 `setmeal`（套餐表）和 `setmeal_dish`（套餐菜品关系表）。
2.  **实体类与 DTO 准备**：
    -   在 `sky-pojo` 模块创建 `Setmeal` 和 `SetmealDish` 实体类。
    -   在 `sky-pojo` 模块创建 `SetmealDTO`（用于接收新增套餐请求）。
3.  **持久层实现 (Mapper)**：
    -   创建 `SetmealMapper` 接口及对应的 XML 映射文件。
    -   完善 `SetmealDishMapper` 接口，支持批量插入套餐关联的菜品。
4.  **业务层实现 (Service)**：
    -   创建 `SetmealService` 接口及 `SetmealServiceImpl` 实现类。
    -   实现 `saveWithDish` 方法（需开启 `@Transactional` 事务管理）。
5.  **控制层实现 (Controller)**：
    -   创建 `SetmealController` 并实现新增套餐的 API 接口。

---

## 🛠️ 具体实施步骤

### 1. 数据库建表 SQL (已由 AI 执行)
我已经尝试连接本地 MySQL 数据库并执行了以下 SQL 语句：

```sql
-- 套餐表
CREATE TABLE `setmeal` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `category_id` bigint(20) NOT NULL COMMENT '分类id',
  `name` varchar(32) COLLATE utf8_bin NOT NULL COMMENT '套餐名称',
  `price` decimal(10,2) NOT NULL COMMENT '套餐价格',
  `status` int(11) DEFAULT '1' COMMENT '状态 0:停用 1:启用',
  `description` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '描述信息',
  `image` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '图片',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `create_user` bigint(20) DEFAULT NULL COMMENT '创建人',
  `update_user` bigint(20) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_setmeal_name`(`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='套餐';

-- 套餐菜品关系表
CREATE TABLE `setmeal_dish` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `setmeal_id` bigint(20) DEFAULT NULL COMMENT '套餐id',
  `dish_id` bigint(20) DEFAULT NULL COMMENT '菜品id',
  `name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT '菜品名称',
  `price` decimal(10,2) DEFAULT NULL COMMENT '菜品原价',
  `copies` int(11) DEFAULT NULL COMMENT '份数',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='套餐菜品关系';
```

### 2. 关键代码预览

#### **Controller 层 (SetmealController)**
```java
@RestController
@RequestMapping("/admin/setmeal")
@Api(tags = "套餐相关接口")
public class SetmealController {
    @Autowired
    private SetmealService setmealService;

    @PostMapping
    @ApiOperation("新增套餐")
    public Result save(@RequestBody SetmealDTO setmealDTO) {
        setmealService.saveWithDish(setmealDTO);
        return Result.success();
    }
}
```

#### **Service 层实现 (SetmealServiceImpl)**
```java
@Service
@Transactional
public class SetmealServiceImpl implements SetmealService {
    @Autowired
    private SetmealMapper setmealMapper;
    @Autowired
    private SetmealDishMapper setmealDishMapper;

    public void saveWithDish(SetmealDTO setmealDTO) {
        Setmeal setmeal = new Setmeal();
        BeanUtils.copyProperties(setmealDTO, setmeal);
        // 插入套餐基本信息
        setmealMapper.insert(setmeal);
        
        // 获取生成的套餐ID，并设置给关联的菜品
        Long setmealId = setmeal.getId();
        List<SetmealDish> setmealDishes = setmealDTO.getSetmealDishes();
        setmealDishes.forEach(sd -> sd.setSetmealId(setmealId));
        
        // 批量保存套餐菜品关系
        setmealDishMapper.insertBatch(setmealDishes);
    }
}
```

---

## ✅ 验收标准
- [ ] 接口 `POST /admin/setmeal` 能够成功接收前端传来的套餐数据。
- [ ] `setmeal` 表成功插入 1 条记录，且主键 ID 正确生成。
- [ ] `setmeal_dish` 表成功插入多条关联菜品记录，且 `setmeal_id` 与套餐表 ID 对应。
- [ ] 使用 `@AutoFill` 注解的公共字段（创建时间、修改人等）被正确填充。
