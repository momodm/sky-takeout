package com.sky.context;

/**
 * 基于ThreadLocal封装的上下文工具类
 * <p>
 * 作用：用于在同一个线程内共享数据（如当前登录用户的ID）。
 * 原理：ThreadLocal 为每个使用该变量的线程提供独立的变量副本，
 *      所以每一个线程都可以独立地改变自己的副本，而不会影响其它线程所对应的副本。
 * 场景：在拦截器中解析Token获得用户ID存入，在Service层获取该ID进行业务处理（如填充createUser）。
 */
public class BaseContext {

    // 定义 ThreadLocal 对象，泛型为 Long，用于存储用户ID
    public static ThreadLocal<Long> threadLocal = new ThreadLocal<>();

    /**
     * 设置当前线程的局部变量值（用户ID）
     * @param id 用户ID
     */
    public static void setCurrentId(Long id) {
        // 将 ID 存入当前线程的 ThreadLocalMap 中
        threadLocal.set(id);
    }

    /**
     * 获取当前线程的局部变量值（用户ID）
     * @return 用户ID
     */
    public static Long getCurrentId() {
        // 从当前线程的 ThreadLocalMap 中取出 ID
        return threadLocal.get();
    }

    /**
     * 移除当前线程的局部变量值
     * <p>
     * 注意：使用线程池时，线程是复用的。如果不清理，可能会导致内存泄漏或数据污染。
     *      虽然在本项目中 Tomcat 会自动回收线程，但手动清理是一个好习惯。
     */
    public static void removeCurrentId() {
        threadLocal.remove();
    }

}
