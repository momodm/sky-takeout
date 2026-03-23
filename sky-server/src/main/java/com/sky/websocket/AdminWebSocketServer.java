package com.sky.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@ServerEndpoint("/ws/admin/orders")
@Slf4j
public class AdminWebSocketServer {

    private static final Set<Session> SESSIONS = new CopyOnWriteArraySet<>();
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @OnOpen
    public void onOpen(Session session) {
        // 管理端连接建立后立即回推一条系统消息，方便前端确认通道已就绪。
        SESSIONS.add(session);
        log.info("Admin websocket connected, online sessions: {}", SESSIONS.size());
        sendText(session, buildSystemMessage("connection_ready", "管理端提醒通道已连接"));
        broadcast(buildSystemMessage("online_count_update", "在线连接数已更新"));
    }

    @OnClose
    public void onClose(Session session) {
        // 连接关闭后同步广播在线连接数变化，保持监控页状态一致。
        removeSession(session);
        log.info("Admin websocket disconnected, online sessions: {}", SESSIONS.size());
        broadcast(buildSystemMessage("online_count_update", "在线连接数已更新"));
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        log.debug("Received admin websocket message from {}: {}", session.getId(), message);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        removeSession(session);
        log.error("Admin websocket error, session: {}", session == null ? "unknown" : session.getId(), throwable);
    }

    public static void broadcast(String message) {
        // 广播时顺手清理失效连接，避免在线数和实际连接集合越来越偏。
        for (Session session : SESSIONS) {
            if (!session.isOpen()) {
                removeSession(session);
                continue;
            }
            sendText(session, message);
        }
    }

    public static int onlineCount() {
        return SESSIONS.size();
    }

    private static void sendText(Session session, String message) {
        try {
            session.getBasicRemote().sendText(message);
        } catch (IOException ex) {
            removeSession(session);
            log.error("Failed to send websocket message", ex);
        }
    }

    private static void removeSession(Session session) {
        if (session != null) {
            SESSIONS.remove(session);
        }
    }

    private static String buildSystemMessage(String type, String message) {
        // 系统消息统一补齐在线数和服务器时间，方便前端直接渲染。
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("message", message);
        payload.put("onlineCount", onlineCount());
        payload.put("serverTime", LocalDateTime.now().format(FORMATTER));
        return toJson(payload);
    }

    private static String toJson(Map<String, Object> payload) {
        StringBuilder builder = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            if (!first) {
                builder.append(',');
            }
            first = false;
            builder.append('"').append(entry.getKey()).append('"').append(':');
            Object value = entry.getValue();
            if (value instanceof Number || value instanceof Boolean) {
                builder.append(value);
            } else {
                builder.append('"').append(String.valueOf(value).replace("\"", "\\\"")).append('"');
            }
        }
        builder.append('}');
        return builder.toString();
    }
}
