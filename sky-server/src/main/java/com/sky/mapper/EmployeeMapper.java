package com.sky.mapper;

import com.sky.annotation.AutoFill;
import com.sky.dto.EmployeePageQueryDTO;
import com.github.pagehelper.Page;
import com.sky.entity.Employee;
import com.sky.enumeration.OperationType;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 员工数据访问接口
 * <p>
 * 作用：定义操作数据库的方法。MyBatis 会自动为该接口生成代理实现类。
 * 注意：方法名必须与 Mapper XML 中的 id 属性一致。
 */
@Mapper
public interface EmployeeMapper {

    /**
     * 根据用户名查询员工
     *
     * @param username 用户名
     * @return 员工实体
     */
    // 使用注解方式编写简单的 SQL，无需配置 XML
    @Select("select * from employee where username = #{username}")
    Employee getByUsername(String username);

    /**
     * 根据id查询员工
     *
     * @param id 员工ID
     * @return 员工实体
     */
    @Select("select * from employee where id = #{id}")
    Employee getById(Long id);

    /**
     * 插入员工数据
     *
     * @param employee 员工实体
     */
    // 插入操作，使用 #{property} 占位符，MyBatis 会自动从对象中获取对应属性值
    @Insert("insert into employee (name, username, password, phone, sex, id_number, create_time, update_time, create_user, update_user, status) " +
            "values " +
            "(#{name},#{username},#{password},#{phone},#{sex},#{idNumber},#{createTime},#{updateTime},#{createUser},#{updateUser},#{status})")
    @AutoFill(value = OperationType.INSERT)
    void insert(Employee employee);

    /**
     * 分页查询
     * <p>
     * 注意：这里返回的是 Page<Employee>，它是 ArrayList 的子类。
     * PageHelper 插件会自动处理 count 查询和分页数据查询。
     *
     * @param employeePageQueryDTO 分页查询参数
     * @return Page 对象
     */
    // 复杂的动态 SQL（如根据姓名模糊查询）通常写在 XML 文件中
    Page<Employee> pageQuery(EmployeePageQueryDTO employeePageQueryDTO);

    /**
     * 根据主键动态修改属性
     * <p>
     * 所谓“动态修改”，是指只修改对象中不为 null 的字段。
     * 这种操作需要使用 XML 中的 <set> 和 <if> 标签来实现。
     *
     * @param employee 员工实体
     */
    @AutoFill(value = OperationType.UPDATE)
    void update(Employee employee);

}
