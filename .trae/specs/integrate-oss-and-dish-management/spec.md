# 集成 OSS 文件上传与菜品管理 Spec

## Why
菜品管理模块需要支持图片的上传与展示，同时新增菜品功能涉及菜品基本信息及其关联的口味信息的保存，需要确保数据的完整性和一致性。

## What Changes
- **OSS 集成**: 引入阿里云 OSS SDK，配置存储参数，实现通用的文件上传功能。
- **新增文件上传接口**: `/admin/common/upload`，支持 MultipartFile 格式。
- **新增菜品功能**: 实现 `POST /admin/dish` 接口，支持同时保存菜品和关联的口味信息。
- **事务管理**: 在新增菜品逻辑中引入事务控制，确保菜品和口味数据同时成功或失败。
- **DTO/VO 定义**: 增加 `DishDTO` 用于接收前端参数，`DishVO` 用于展示（后续使用）。

## Impact
- 影响系统：管理端后台系统。
- 涉及模块：`sky-common` (工具类), `sky-server` (业务逻辑), `sky-pojo` (数据模型)。
- 关键文件：`CommonController`, `DishController`, `DishService`, `DishMapper`, `DishFlavorMapper`。

## ADDED Requirements
### Requirement: 文件上传功能
系统应支持将本地图片上传至阿里云 OSS，并返回文件的完整 URL 路径。

#### Scenario: 成功上传图片
- **WHEN** 用户调用 `/admin/common/upload` 接口并提供合法的图片文件
- **THEN** 系统返回 `code: 1`，并包含图片的访问 URL。

### Requirement: 新增菜品功能
系统应支持保存菜品信息，包括名称、分类、价格、图片、描述、售卖状态，以及关联的口味列表。

#### Scenario: 成功新增带口味的菜品
- **WHEN** 用户调用 `POST /admin/dish` 并提供完整的菜品和口味 JSON 数据
- **THEN** 系统在 `dish` 表插入一条记录，在 `dish_flavor` 表插入对应的口味记录，返回 `code: 1`。

## MODIFIED Requirements
无。

## REMOVED Requirements
无。
