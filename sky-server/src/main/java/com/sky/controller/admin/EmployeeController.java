package com.sky.controller.admin;

import com.sky.constant.JwtClaimsConstant;
import com.sky.dto.EmployeeLoginDTO;
import com.sky.entity.Employee;
import com.sky.properties.JwtProperties;
import com.sky.result.Result;
import com.sky.service.EmployeeService;
import com.sky.utils.JwtUtil;
import com.sky.vo.EmployeeLoginVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import com.sky.dto.EmployeeDTO;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.result.PageResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

/**
 * 员工管理控制器
 * <p>
 * 作用：接收前端发来的员工管理相关请求（登录、增删改查），调用 Service 层处理业务，并返回统一格式的结果。
 */
@RestController
@RequestMapping("/admin/employee")
@Slf4j
@Api(tags = "员工相关接口")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 登录
     *
     * @param employeeLoginDTO 登录参数（用户名、密码）
     * @return 包含 Token 和员工信息的 VO 对象
     */
    @PostMapping("/login")
    @ApiOperation(value = "员工登录")
    public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO employeeLoginDTO) {
        log.info("员工登录：{}", employeeLoginDTO);

        // 1. 调用 Service 进行登录校验（用户名密码比对）
        Employee employee = employeeService.login(employeeLoginDTO);

        // 2. 登录成功后，生成 JWT 令牌
        Map<String, Object> claims = new HashMap<>();
        // 将员工 ID 放入 Token 的载荷中，方便后续请求识别用户身份
        claims.put(JwtClaimsConstant.EMP_ID, employee.getId());
        String token = JwtUtil.createJWT(
                jwtProperties.getAdminSecretKey(), // 密钥
                jwtProperties.getAdminTtl(),       // 过期时间
                claims);

        // 3. 封装返回给前端的数据（VO）
        EmployeeLoginVO employeeLoginVO = EmployeeLoginVO.builder()
                .id(employee.getId())
                .userName(employee.getUsername())
                .name(employee.getName())
                .token(token) // 将生成的 Token 返回给前端，前端后续请求需携带此 Token
                .build();

        return Result.success(employeeLoginVO);
    }

    /**
     * 根据id查询员工信息
     * <p>
     * 场景：编辑员工时，需要先回显员工信息。
     *
     * @param id 员工ID（路径参数）
     * @return 员工实体对象
     */
    @GetMapping("/{id}")
    @ApiOperation("根据id查询员工信息")
    public Result<Employee> getById(@PathVariable Long id){
        Employee employee = employeeService.getById(id);
        return Result.success(employee);
    }

    /**
     * 编辑员工信息
     *
     * @param employeeDTO 员工信息 DTO（包含需修改的字段）
     * @return 操作结果
     */
    @PutMapping
    @ApiOperation("编辑员工信息")
    public Result<String> update(@RequestBody EmployeeDTO employeeDTO){
        log.info("编辑员工信息：{}", employeeDTO);
        employeeService.update(employeeDTO);
        return Result.success();
    }

    /**
     * 新增员工
     *
     * @param employeeDTO 新增员工的数据传输对象
     * @return 操作结果
     */
    @PostMapping
    @ApiOperation("新增员工")
    public Result<String> save(@RequestBody EmployeeDTO employeeDTO){
        log.info("新增员工：{}", employeeDTO);
        // 调用 Service 层新增员工
        // 注意：Controller 层只负责接收和响应，不处理具体业务逻辑（如密码加密、公共字段填充）
        employeeService.save(employeeDTO);
        return Result.success();
    }

    /**
     * 员工分页查询
     *
     * @param employeePageQueryDTO 分页查询参数（页码、每页记录数、姓名关键词）
     * @return 分页结果（总记录数、当前页数据列表）
     */
    @GetMapping("/page")
    @ApiOperation("员工分页查询")
    public Result<PageResult> page(EmployeePageQueryDTO employeePageQueryDTO){
        log.info("员工分页查询，参数为：{}", employeePageQueryDTO);
        PageResult pageResult = employeeService.pageQuery(employeePageQueryDTO);
        return Result.success(pageResult);
    }

    /**
     * 退出
     *
     * @return 操作结果
     */
    @PostMapping("/logout")
    @ApiOperation("员工退出")
    public Result<String> logout() {
        // JWT 是无状态的，后端无法直接让 Token 失效。
        // 通常由前端清除本地存储的 Token 即可。
        return Result.success();
    }

    /**
     * 启用禁用员工账号
     *
     * @param status 状态（1:启用, 0:禁用）
     * @param id 员工ID
     * @return 操作结果
     */
    @PostMapping("/status/{status}")
    @ApiOperation("启用禁用员工账号")
    public Result<String> startOrStop(@PathVariable Integer status, Long id){
        log.info("启用禁用员工账号：{},{}",status,id);
        employeeService.startOrStop(status,id);
        return Result.success();
    }
}
