# 教学注释添加计划

本文档旨在规划为“苍穹外卖”项目核心代码添加详细教学注释的步骤。目标是帮助初学者理解每一行代码的作用、设计意图及潜在的“坑”。

## 1. 涉及文件

### 1.1 业务逻辑层 (Service & Controller)
- **EmployeeController.java**: 员工管理的入口，负责接收前端请求。
- **EmployeeServiceImpl.java**: 核心业务逻辑，处理员工数据的增删改查。

### 1.2 数据访问层 (Mapper)
- **EmployeeMapper.java**: Java 接口定义。
- **EmployeeMapper.xml**: 具体的 SQL 实现（特别是动态 SQL）。

### 1.3 基础设施与配置 (Infrastructure)
- **BaseContext.java**: 解释 ThreadLocal 的作用（线程隔离）。
- **JwtTokenAdminInterceptor.java**: 解释拦截器如何解析 Token 并进行权限校验。
- **WebMvcConfiguration.java**: 解释 Spring MVC 的扩展配置（拦截器注册、消息转换器）。
- **JacksonObjectMapper.java**: 解释为什么需要自定义 JSON 序列化（处理日期格式、Long 类型精度丢失）。

## 2. 注释策略

对于每一个文件，将采用以下注释风格：

- **类级别注释**: 解释该类的核心职责（Role）。
- **方法级别注释**: 解释方法的功能、输入（Parameters）、输出（Return）。
- **行内注释**:
    - **关键逻辑**: 解释“为什么这么写”，而不是“写了什么”。
    - **技术难点**: 比如 `ThreadLocal` 的使用场景、`MD5` 加密、`PageHelper` 分页原理。
    - **易错点**: 比如 `Long` 类型传给前端精度丢失问题、动态 SQL 的 `<if>` 标签用法。

## 3. 详细步骤

### 3.1 基础设施层 (优先注释，因为它们是基础)

#### BaseContext.java
- 解释 `ThreadLocal` 是什么（线程局部变量）。
- 解释为什么在拦截器里 `set`，在 Service 里 `get`（跨层传递参数）。

#### JacksonObjectMapper.java
- 解释 `ObjectMapper` 的作用（Java 对象 <-> JSON）。
- 解释为什么需要 `SimpleModule` 注册新的序列化器（处理 Java 8 时间类型）。
- **重点**: 解释 `FAIL_ON_UNKNOWN_PROPERTIES` 的配置意图。

#### WebMvcConfiguration.java
- 解释 `extendMessageConverters` 的作用（替换默认的消息转换器）。
- 解释 `converters.add(0, converter)` 为什么要加在第一位。

#### JwtTokenAdminInterceptor.java
- 解释 `preHandle` 方法的执行时机。
- 解释如何从 Header 中获取 Token。
- 解释 Token 校验失败后的处理（响应 401）。

### 3.2 业务功能层

#### EmployeeController.java
- 解释 `@RequestBody` (接收 JSON) 和 `@PathVariable` (接收路径参数) 的区别。
- 解释 `Result<T>` 泛型的作用。

#### EmployeeServiceImpl.java
- **登录逻辑**: 解释 MD5 加密比对过程。
- **新增员工**: 解释对象属性拷贝 `BeanUtils.copyProperties`。
- **ThreadLocal**: 解释 `BaseContext.getCurrentId()` 如何获取当前登录用户 ID。

### 3.3 数据访问层

#### EmployeeMapper.java & xml
- 解释 `@Mapper` 注解。
- 解释 XML 中的动态 SQL (`<if>`, `<set>`, `<where>`) 如何拼接 SQL 语句。
- 解释 `PageHelper` 插件是如何通过拦截器自动添加 `LIMIT` 语句的。

## 4. 验证与交付
- 确认所有修改后的代码能正常编译。
- 确保注释清晰、准确，符合中文阅读习惯。
- 最终通知用户完成。
