package com.sky.service.impl;

import com.github.pagehelper.Page;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.entity.Employee;
import com.sky.exception.BaseException;
import com.sky.mapper.EmployeeMapper;
import com.sky.result.PageResult;
import com.sky.vo.EmployeeVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    @Test
    void pageQueryShouldReturnEmployeeVOWithoutPasswordField() {
        Employee employee = Employee.builder()
                .id(1L)
                .username("admin")
                .name("Admin")
                .password("secret")
                .build();
        Page<Employee> page = new Page<>();
        page.add(employee);
        page.setTotal(1);
        when(employeeMapper.pageQuery(ArgumentMatchers.any(EmployeePageQueryDTO.class))).thenReturn(page);

        PageResult pageResult = employeeService.pageQuery(new EmployeePageQueryDTO());

        @SuppressWarnings("unchecked")
        List<EmployeeVO> records = (List<EmployeeVO>) pageResult.getRecords();
        assertEquals(1, records.size());
        assertEquals("admin", records.get(0).getUsername());
        assertEquals("Admin", records.get(0).getName());
    }

    @Test
    void getByIdShouldReturnEmployeeVO() {
        Employee employee = Employee.builder()
                .id(2L)
                .username("zhangsan")
                .name("Zhang San")
                .password("secret")
                .build();
        when(employeeMapper.getById(2L)).thenReturn(employee);

        EmployeeVO employeeVO = employeeService.getById(2L);

        assertEquals(2L, employeeVO.getId());
        assertEquals("zhangsan", employeeVO.getUsername());
        assertEquals("Zhang San", employeeVO.getName());
    }

    @Test
    void getByIdShouldRejectMissingEmployee() {
        when(employeeMapper.getById(99L)).thenReturn(null);

        BaseException ex = assertThrows(BaseException.class, () -> employeeService.getById(99L));

        assertEquals("员工不存在", ex.getMessage());
    }
}
