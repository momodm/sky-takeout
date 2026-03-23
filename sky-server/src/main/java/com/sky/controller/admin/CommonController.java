package com.sky.controller.admin;

import com.sky.constant.MessageConstant;
import com.sky.result.Result;
import com.sky.utils.AliyunOssUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import java.util.UUID;

/**
 * 通用接口
 */
@RestController
@RequestMapping("/admin/common")
@Api(tags = "通用接口")
@Slf4j
public class CommonController {

    @Autowired
    private AliyunOssUtil aliyunOssUtil;

    /**
     * 文件上传
     * @param file 上传文件
     * @return 文件访问地址
     */
    @PostMapping("/upload")
    @ApiOperation("文件上传")
    public Result<String> upload(@RequestParam("file") MultipartFile file) {
        log.info("文件上传: {}", file);

        if (file == null || file.isEmpty()) {
            return Result.error(MessageConstant.UPLOAD_FAILED);
        }

        try {
            String originalFilename = Objects.toString(file.getOriginalFilename(), "");
            int dotIndex = originalFilename.lastIndexOf('.');
            String extension = dotIndex >= 0 ? originalFilename.substring(dotIndex) : "";
            String objectName = UUID.randomUUID() + extension;
            String filePath = aliyunOssUtil.upload(file.getBytes(), objectName);
            return Result.success(filePath);
        } catch (Exception e) {
            log.error("文件上传失败", e);
            return Result.error(MessageConstant.UPLOAD_FAILED);
        }
    }
}
