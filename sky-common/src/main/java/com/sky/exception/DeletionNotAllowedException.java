package com.sky.exception;

/**
 * 删除操作不允许异常
 */
public class DeletionNotAllowedException extends BaseException {

    public DeletionNotAllowedException() {
    }

    public DeletionNotAllowedException(String msg) {
        super(msg);
    }

}
