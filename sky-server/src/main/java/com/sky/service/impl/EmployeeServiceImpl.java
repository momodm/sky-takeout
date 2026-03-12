package com.sky.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.sky.constant.MessageConstant;
import com.sky.constant.PasswordConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.EmployeeDTO;
import com.sky.dto.EmployeeLoginDTO;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.entity.Employee;
import com.sky.exception.AccountLockedException;
import com.sky.exception.AccountNotFoundException;
import com.sky.exception.PasswordErrorException;
import com.sky.mapper.EmployeeMapper;
import com.sky.result.PageResult;
import com.sky.service.EmployeeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 员工业务实现类
 * <p>
 * 作用：实现 EmployeeService 接口，处理具体的业务逻辑（验证、计算、调用 Mapper）。
 */
@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    /**
     * 员工登录
     *
     * @param employeeLoginDTO 登录参数
     * @return 登录成功的员工实体对象
     */
    public Employee login(EmployeeLoginDTO employeeLoginDTO) {
        String username = employeeLoginDTO.getUsername();
        String password = employeeLoginDTO.getPassword();

        // 1. 根据用户名查询数据库中的数据
        Employee employee = employeeMapper.getByUsername(username);

        // 2. 处理各种异常情况（用户名不存在、密码错误、账号被锁定）
        if (employee == null) {
            // 账号不存在，抛出自定义异常
            throw new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        // 3. 密码比对
        // 注意：数据库中存储的是 MD5 加密后的密码，所以需要先将前端传来的明文密码进行加密，再比对
        password = DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
        if (!password.equals(employee.getPassword())) {
            // 密码错误，抛出自定义异常
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        // 4. 检查账号状态
        if (employee.getStatus() == StatusConstant.DISABLE) {
            // 账号被锁定（status = 0）
            throw new AccountLockedException(MessageConstant.ACCOUNT_LOCKED);
        }

        // 5. 登录成功，返回实体对象
        return employee;
    }

    /**
     * 新增员工
     *
     * @param employeeDTO 新增员工的数据传输对象
     */
    public void save(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();

        // 对象属性拷贝
        // 将 DTO 中的属性值拷贝到 Entity 中（前提：属性名和类型一致）
        // 这是一个常用的简化代码的技巧，避免手动写大量的 set 方法
        BeanUtils.copyProperties(employeeDTO, employee);

        // 设置账号的状态，默认正常状态 1表示正常 0表示锁定
        // StatusConstant.ENABLE 是一个常量，增加代码可读性
        employee.setStatus(StatusConstant.ENABLE);

        // 设置密码，默认密码123456
        // 同样需要进行 MD5 加密
        employee.setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()));

        // 设置当前记录的创建时间和修改时间
        employee.setCreateTime(LocalDateTime.now());
        employee.setUpdateTime(LocalDateTime.now());

        // 设置当前记录创建人id和修改人id
        // 这里使用了 ThreadLocal（BaseContext）来获取当前登录用户的 ID
        // 因为在拦截器中已经将 Token 解析出的 ID 存入了 ThreadLocal
        employee.setCreateUser(BaseContext.getCurrentId());
        employee.setUpdateUser(BaseContext.getCurrentId());

        // 调用持久层插入数据
        employeeMapper.insert(employee);
    }

    /**
     * 分页查询
     *
     * @param employeePageQueryDTO 分页查询参数
     * @return 分页结果对象（包含总记录数和当前页数据列表）
     */
    public PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO) {
        // select * from employee limit 0,10
        // 开始分页查询
        // PageHelper 插件会自动拦截后续的 SQL 语句，并在其后面添加 limit 语句
        PageHelper.startPage(employeePageQueryDTO.getPage(), employeePageQueryDTO.getPageSize());

        // 调用 Mapper 查询（这里返回的 Page 对象是 PageHelper 提供的，继承自 ArrayList）
        Page<Employee> page = employeeMapper.pageQuery(employeePageQueryDTO);

        long total = page.getTotal();
        List<Employee> records = page.getResult();

        return new PageResult(total, records);
    }

    /**
     * 启用禁用员工账号
     *
     * @param status 状态
     * @param id 员工ID
     */
    public void startOrStop(Integer status, Long id) {
        // 使用 Builder 模式构建对象（Lombok @Builder 注解提供）
        // 这种方式比 new Employee() + set 方法更优雅
        Employee employee = Employee.builder()
                .status(status)
                .id(id)
                .build();
        // 复用 update 方法进行动态更新
        employeeMapper.update(employee);
    }

    /**
     * 根据ID查询员工
     *
     * @param id 员工ID
     * @return 员工实体
     */
    public Employee getById(Long id) {
        Employee employee = employeeMapper.getById(id);
        // 安全起见，查询出的密码不应该返回给前端，将其设置为掩码
        employee.setPassword("****");
        return employee;
    }

    /**
     * 编辑员工信息
     *
     * @param employeeDTO 员工信息 DTO
     */
    public void update(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        // 属性拷贝
        BeanUtils.copyProperties(employeeDTO, employee);

        // 设置修改时间和修改人
        employee.setUpdateTime(LocalDateTime.now());
        employee.setUpdateUser(BaseContext.getCurrentId()); // 从 ThreadLocal 获取当前登录用户 ID

        // 动态更新
        employeeMapper.update(employee);
    }

}
