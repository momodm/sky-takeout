package com.sky.config;

import com.github.xiaoymin.knife4j.spring.annotations.EnableKnife4j;
import com.sky.interceptor.JwtTokenAdminInterceptor;
import com.sky.json.JacksonObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.util.List;

/**
 * 配置类，注册web层相关组件
 * <p>
 * 作用：
 * 1. 注册拦截器
 * 2. 扩展消息转换器
 * 3. 配置 Swagger 文档
 */
@Configuration
@EnableSwagger2
@EnableKnife4j
@Slf4j
public class WebMvcConfiguration extends WebMvcConfigurationSupport {

    @Autowired
    private JwtTokenAdminInterceptor jwtTokenAdminInterceptor;

    /**
     * 注册自定义拦截器
     *
     * @param registry 拦截器注册表
     */
    protected void addInterceptors(InterceptorRegistry registry) {
        log.info("开始注册自定义拦截器...");
        // 注册 JWT 拦截器，并配置拦截路径和排除路径
        registry.addInterceptor(jwtTokenAdminInterceptor)
                .addPathPatterns("/admin/**") // 拦截所有 admin 开头的请求
                .excludePathPatterns("/admin/employee/login"); // 排除登录接口，因为登录时还没有 Token
    }

    /**
     * 扩展Spring MVC框架的消息转换器
     * <p>
     * 作用：替换或增加 Spring MVC 默认的消息转换器。
     * 默认情况下，Spring 使用 Jackson 进行 JSON 序列化，但默认配置可能不满足需求（如日期格式、Long 精度丢失）。
     *
     * @param converters 消息转换器列表
     */
    protected void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        log.info("扩展消息转换器...");
        // 1. 创建一个消息转换器对象
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        
        // 2. 为消息转换器设置一个对象转换器（ObjectMapper）
        // JacksonObjectMapper 是我们自定义的，配置了日期格式化和未知属性忽略等
        converter.setObjectMapper(new JacksonObjectMapper());
        
        // 3. 将自定义的消息转换器加入容器中
        // 注意：必须加在 index=0 的位置，确保它排在默认转换器之前，从而被优先使用
        converters.add(0, converter);
    }

    /**
     * 创建 Swagger 文档的 Docket Bean
     * @return Docket
     */
    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo())
                .select()
                // 指定扫描的包路径，只生成该包下的接口文档
                .apis(RequestHandlerSelectors.basePackage("com.sky.controller"))
                .paths(PathSelectors.any())
                .build();
    }

    /**
     * 配置文档基本信息
     * @return ApiInfo
     */
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("苍穹外卖项目接口文档")
                .version("2.0")
                .description("苍穹外卖项目接口文档")
                .build();
    }

    /**
     * 设置静态资源映射
     * <p>
     * 因为继承了 WebMvcConfigurationSupport，默认的静态资源映射会失效，
     * 所以需要手动配置 Swagger 相关资源的映射，否则文档页面无法访问。
     *
     * @param registry 资源处理器注册表
     */
    protected void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/doc.html").addResourceLocations("classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/META-INF/resources/webjars/");
    }

}
