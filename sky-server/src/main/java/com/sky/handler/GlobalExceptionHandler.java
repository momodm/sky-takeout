package com.sky.handler;

import com.sky.constant.MessageConstant;
import com.sky.exception.BaseException;
import com.sky.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLIntegrityConstraintViolationException;

/**
 * 全局异常处理器。
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 处理业务异常。
     */
    @ExceptionHandler
    public Result<String> exceptionHandler(BaseException ex) {
        log.error("Business exception: {}", ex.getMessage(), ex);
        return Result.error(ex.getMessage());
    }

    /**
     * 处理数据库唯一约束等 SQL 异常。
     */
    @ExceptionHandler
    public Result<String> exceptionHandler(SQLIntegrityConstraintViolationException ex) {
        String message = ex.getMessage();
        if (message != null && message.contains("Duplicate entry")) {
            String[] split = message.split(" ");
            String value = split.length > 2 ? split[2] : "";
            return Result.error(value + MessageConstant.ALREADY_EXISTS);
        }
        log.error("SQL integrity constraint violation", ex);
        return Result.error(MessageConstant.UNKNOWN_ERROR);
    }
}
