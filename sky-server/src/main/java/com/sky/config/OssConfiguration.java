package com.sky.config;

import com.sky.properties.AliyunOssProperties;
import com.sky.utils.AliyunOssUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 配置类，用于创建AliyunOssUtil对象
 */
@Configuration
@Slf4j
public class OssConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public AliyunOssUtil aliyunOssUtil(AliyunOssProperties aliyunOssProperties) {
        log.info("开始创建阿里云文件上传工具类对象：{}", aliyunOssProperties);
        return new AliyunOssUtil(aliyunOssProperties.getEndpoint(),
                aliyunOssProperties.getAccessKeyId(),
                aliyunOssProperties.getAccessKeySecret(),
                aliyunOssProperties.getBucketName());
    }
}
