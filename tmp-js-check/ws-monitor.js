
    const KEY = {
      token: "sky_admin_token",
      demo: "sky_demo_mode"
    };

    const ENV = {
      file: location.protocol === "file:",
      monitorUrl: "http://127.0.0.1/ws-monitor.html",
      realtimeUrl: "/api/workspace/realtime",
      socketUrl: `ws://${location.hostname || "127.0.0.1"}:8080/ws/admin/orders`
    };

    const state = {
      socket: null,
      messages: [],
      count: 0
    };

    const MESSAGE_LABELS = {
      connection_ready: "通道就绪",
      online_count_update: "在线更新",
      new_order: "来单提醒",
      order_reminder: "催单提醒",
      raw_message: "原始消息"
    };

    const el = {
      originNotice: document.getElementById("originNotice"),
      originLabel: document.getElementById("originLabel"),
      originText: document.getElementById("originText"),
      tokenInput: document.getElementById("tokenInput"),
      tokenForm: document.getElementById("tokenForm"),
      tokenStatus: document.getElementById("tokenStatus"),
      modeStatus: document.getElementById("modeStatus"),
      clearBtn: document.getElementById("clearBtn"),
      demoBtn: document.getElementById("demoBtn"),
      connectBtn: document.getElementById("connectBtn"),
      disconnectBtn: document.getElementById("disconnectBtn"),
      socketUrl: document.getElementById("socketUrl"),
      logBody: document.getElementById("logBody"),
      messageCount: document.getElementById("messageCount"),
      onlineCount: document.getElementById("onlineCount"),
      lastType: document.getElementById("lastType"),
      lastTime: document.getElementById("lastTime"),
      todayOrders: document.getElementById("todayOrders"),
      todayTurnover: document.getElementById("todayTurnover"),
      todayUsers: document.getElementById("todayUsers"),
      todayCompletionRate: document.getElementById("todayCompletionRate"),
      pendingPaymentOrders: document.getElementById("pendingPaymentOrders"),
      toBeConfirmedOrders: document.getElementById("toBeConfirmedOrders"),
      deliveryInProgressOrders: document.getElementById("deliveryInProgressOrders"),
      websocketOnlineCount: document.getElementById("websocketOnlineCount")
    };

    function normalizeToken(value = "") {
      return value.trim().replace(/^"+|"+$/g, "");
    }

    function getToken() {
      return normalizeToken(localStorage.getItem(KEY.token) || "");
    }

    function isDemoLocked() {
      return localStorage.getItem(KEY.demo) === "1";
    }

    function setNotice(type, label, text) {
      el.originNotice.className = `notice ${type}`;
      el.originLabel.textContent = label;
      el.originText.textContent = text;
    }

    function updateTokenUI() {
      const token = getToken();
      el.tokenInput.value = token;
      el.tokenStatus.textContent = token ? "Token：已保存" : "Token：未保存";
      el.modeStatus.textContent = isDemoLocked() ? "模式：演示锁定" : "模式：真实优先";
      el.demoBtn.textContent = isDemoLocked() ? "恢复真实优先" : "锁定演示";
    }

    function formatInt(value) {
      return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
    }

    function formatMoney(value) {
      return new Intl.NumberFormat("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value || 0));
    }

    function formatPercent(value) {
      return `${formatMoney(value)}%`;
    }

    function formatMessageType(type) {
      return MESSAGE_LABELS[type] || type || "-";
    }

    function formatMessageTime(date = new Date()) {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(date);
    }

    function mockRealtime() {
      const index = Math.floor(Date.now() / 12000) % 3;
      return [
        {
          todayOrders: 0,
          todayTurnover: 0,
          todayUsers: 0,
          todayCompletionRate: 0,
          pendingPaymentOrders: 0,
          toBeConfirmedOrders: 0,
          deliveryInProgressOrders: 0,
          websocketOnlineCount: 0
        },
        {
          todayOrders: 24,
          todayTurnover: 686.3,
          todayUsers: 8,
          todayCompletionRate: 78,
          pendingPaymentOrders: 2,
          toBeConfirmedOrders: 1,
          deliveryInProgressOrders: 3,
          websocketOnlineCount: 2
        },
        {
          todayOrders: 39,
          todayTurnover: 1028.4,
          todayUsers: 12,
          todayCompletionRate: 44,
          pendingPaymentOrders: 5,
          toBeConfirmedOrders: 4,
          deliveryInProgressOrders: 4,
          websocketOnlineCount: 4
        }
      ][index];
    }

    function applyRealtime(data) {
      el.todayOrders.textContent = formatInt(data.todayOrders);
      el.todayTurnover.textContent = formatMoney(data.todayTurnover);
      el.todayUsers.textContent = formatInt(data.todayUsers);
      el.todayCompletionRate.textContent = formatPercent(data.todayCompletionRate);
      el.pendingPaymentOrders.textContent = formatInt(data.pendingPaymentOrders);
      el.toBeConfirmedOrders.textContent = formatInt(data.toBeConfirmedOrders);
      el.deliveryInProgressOrders.textContent = formatInt(data.deliveryInProgressOrders);
      el.websocketOnlineCount.textContent = formatInt(data.websocketOnlineCount);
    }

    async function refreshRealtime() {
      if (isDemoLocked()) {
        applyRealtime(mockRealtime());
        setNotice("fallback", "演示模式", "当前展示的是模拟态势和模拟消息。");
        return;
      }

      if (ENV.file) {
        applyRealtime(mockRealtime());
        setNotice("fallback", "本地文件", "请改用 http://127.0.0.1/ws-monitor.html 打开，才能使用真实链路。");
        return;
      }

      const token = getToken();
      if (!token) {
        applyRealtime(mockRealtime());
        setNotice("fallback", "缺少 Token", "还没有保存管理员 token，当前已回退到演示数据。");
        return;
      }

      try {
        const response = await fetch(ENV.realtimeUrl, {
          headers: { token }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        applyRealtime(payload.data || {});
        setNotice("live", "真实数据", "实时态势已从工作台接口刷新。");
      } catch (error) {
        applyRealtime(mockRealtime());
        setNotice("fallback", "回退演示", `真实接口暂不可用，原因：${error.message}`);
      }
    }

    function renderLog() {
      if (!state.messages.length) {
        el.logBody.textContent = "[等待中] 还没有收到消息。";
        return;
      }
      el.logBody.textContent = state.messages
        .slice(-18)
        .reverse()
        .map((item) => `[${item.at}] ${item.type}\n${JSON.stringify(item.payload, null, 2)}`)
        .join("\n\n");
      el.logBody.scrollTop = el.logBody.scrollHeight;
    }

    function addMessage(type, payload) {
      const time = formatMessageTime(new Date());

      state.messages.push({ type, payload, at: time });
      state.messages = state.messages.slice(-160);
      state.count += 1;

      el.messageCount.textContent = formatInt(state.count);
      el.lastType.textContent = formatMessageType(type);
      el.lastTime.textContent = time;
      if (typeof payload.onlineCount !== "undefined") {
        el.onlineCount.textContent = formatInt(payload.onlineCount);
      }
      renderLog();
    }

    function startMockMessages() {
      addMessage("connection_ready", {
        onlineCount: 1,
        serverTime: new Date().toISOString()
      });
    }

    function disconnectSocket() {
      if (state.socket) {
        state.socket.close();
        state.socket = null;
      }
    }

    function connectSocket() {
      disconnectSocket();

      if (ENV.file || isDemoLocked()) {
        startMockMessages();
        setNotice("fallback", "模拟消息", "当前处于本地文件或演示模式，已切换到模拟消息流。");
        return;
      }

      try {
        state.socket = new WebSocket(ENV.socketUrl);
        setNotice("live", "连接中", "正在建立真实提醒通道。");
        state.socket.onopen = () => {
          setNotice("live", "已连接", "真实提醒通道已建立连接。");
        };
        state.socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            addMessage(payload.type || "raw_message", payload);
          } catch (_error) {
            addMessage("raw_message", { raw: event.data });
          }
        };
        state.socket.onerror = () => {
          setNotice("fallback", "连接异常", "真实提醒通道连接异常，已回退到模拟消息流。");
          disconnectSocket();
          startMockMessages();
        };
        state.socket.onclose = () => {
          if (!isDemoLocked()) {
            setNotice("fallback", "已断开", "真实提醒通道已断开，已回退到模拟消息流。");
          }
        };
      } catch (_error) {
        setNotice("fallback", "创建失败", "无法创建真实提醒通道，已回退到模拟消息流。");
        startMockMessages();
      }
    }

    el.socketUrl.textContent = ENV.socketUrl;

    el.tokenForm.addEventListener("submit", (event) => {
      event.preventDefault();
      localStorage.setItem(KEY.token, normalizeToken(el.tokenInput.value));
      updateTokenUI();
      refreshRealtime();
    });

    el.clearBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY.token);
      updateTokenUI();
      refreshRealtime();
    });

    el.demoBtn.addEventListener("click", () => {
      if (isDemoLocked()) {
        localStorage.removeItem(KEY.demo);
      } else {
        localStorage.setItem(KEY.demo, "1");
      }
      updateTokenUI();
      refreshRealtime();
      connectSocket();
    });

    el.connectBtn.addEventListener("click", connectSocket);
    el.disconnectBtn.addEventListener("click", () => {
      disconnectSocket();
      setNotice("fallback", "已断开", "提醒通道已手动断开。");
    });

    updateTokenUI();
    refreshRealtime();
    connectSocket();
    setInterval(refreshRealtime, 15000);
  
