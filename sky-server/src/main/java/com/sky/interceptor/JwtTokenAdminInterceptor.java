package com.sky.interceptor;

import com.sky.constant.JwtClaimsConstant;
import com.sky.context.BaseContext;
import com.sky.properties.JwtProperties;
import com.sky.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * jwt令牌校验的拦截器
 * <p>
 * 作用：统一拦截请求，校验用户身份。
 * 原理：实现了 Spring MVC 的 HandlerInterceptor 接口。
 */
@Component
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 校验jwt
     * <p>
     * 触发时机：在请求到达 Controller 方法之前执行。
     *
     * @param request  请求对象
     * @param response 响应对象
     * @param handler  被拦截的目标对象
     * @return true: 放行；false: 不放行
     */
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 判断当前拦截到的是 Controller 的方法还是其他资源（如静态资源映射）
        // 如果不是映射到方法（HandlerMethod），则直接放行
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        // 1、从请求头中获取令牌
        // 前端约定将 Token 放在 Header 中，Key 由配置决定（通常是 "token" 或 "Authorization"）
        String token = request.getHeader(jwtProperties.getAdminTokenName());

        // 2、校验令牌
        try {
            log.info("jwt校验:{}", token);
            // 解析 Token，如果过期或篡改，这里会抛出异常
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            
            // 从 Token 的载荷（Payload）中获取员工 ID
            Long empId = Long.valueOf(claims.get(JwtClaimsConstant.EMP_ID).toString());
            log.info("当前员工id:{}", empId);
            
            // 将用户 ID 存入 ThreadLocal，方便后续 Service/Mapper 层直接获取
            // 这一步非常关键，实现了用户身份信息的线程内共享
            BaseContext.setCurrentId(empId);
            
            // 3、通过，放行
            return true;
        } catch (Exception ex) {
            // 4、不通过，响应 401 状态码（未授权）
            response.setStatus(401);
            // 拦截请求，不再向下执行
            return false;
        }
    }

    /**
     * 视图渲染结束后的回调方法
     * <p>
     * 作用：在整个请求结束之后（DispatcherServlet 渲染了对应的视图之后）执行。
     *      主要用于进行资源清理工作，防止内存泄漏。
     * 
     * @param request 请求对象
     * @param response 响应对象
     * @param handler 拦截的目标对象
     * @param ex 异常信息
     * @throws Exception
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 清理 ThreadLocal 中的数据，防止内存泄漏和数据污染
        BaseContext.removeCurrentId();
    }
}
