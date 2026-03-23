
    const KEY = {
      token: "sky_admin_token",
      demo: "sky_demo_mode"
    };

    const ENV = {
      file: location.protocol === "file:",
      dashboardUrl: "http://127.0.0.1/index.html",
      realtimeUrl: "/api/workspace/realtime"
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
      todayOrders: document.getElementById("todayOrders"),
      todayTurnover: document.getElementById("todayTurnover"),
      todayUsers: document.getElementById("todayUsers"),
      todayCompletionRate: document.getElementById("todayCompletionRate"),
      pendingPaymentOrders: document.getElementById("pendingPaymentOrders"),
      toBeConfirmedOrders: document.getElementById("toBeConfirmedOrders"),
      deliveryInProgressOrders: document.getElementById("deliveryInProgressOrders"),
      websocketOnlineCount: document.getElementById("websocketOnlineCount"),
      pendingCard: document.getElementById("pendingCard"),
      confirmCard: document.getElementById("confirmCard"),
      deliveryCard: document.getElementById("deliveryCard")
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

    function applyMetrics(data) {
      const todayOrders = Number(data.todayOrders || 0);
      const todayTurnover = Number(data.todayTurnover || 0);
      const todayUsers = Number(data.todayUsers || 0);
      const completionRate = Number(data.todayCompletionRate || 0);
      const pending = Number(data.pendingPaymentOrders || 0);
      const confirm = Number(data.toBeConfirmedOrders || 0);
      const delivery = Number(data.deliveryInProgressOrders || 0);
      const ws = Number(data.websocketOnlineCount || 0);

      el.todayOrders.textContent = formatInt(todayOrders);
      el.todayTurnover.textContent = formatMoney(todayTurnover);
      el.todayUsers.textContent = formatInt(todayUsers);
      el.todayCompletionRate.textContent = formatPercent(completionRate);
      el.pendingPaymentOrders.textContent = formatInt(pending);
      el.toBeConfirmedOrders.textContent = formatInt(confirm);
      el.deliveryInProgressOrders.textContent = formatInt(delivery);
      el.websocketOnlineCount.textContent = formatInt(ws);

      [el.pendingCard, el.confirmCard, el.deliveryCard].forEach((node) => node.classList.remove("hot"));
      if (pending > 0) el.pendingCard.classList.add("hot");
      if (confirm > 0) el.confirmCard.classList.add("hot");
      if (delivery > 0) el.deliveryCard.classList.add("hot");
    }

    function mockData() {
      const index = Math.floor(Date.now() / 15000) % 3;
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
          todayOrders: 28,
          todayTurnover: 788.5,
          todayUsers: 9,
          todayCompletionRate: 82,
          pendingPaymentOrders: 2,
          toBeConfirmedOrders: 1,
          deliveryInProgressOrders: 3,
          websocketOnlineCount: 2
        },
        {
          todayOrders: 41,
          todayTurnover: 1146.2,
          todayUsers: 13,
          todayCompletionRate: 47,
          pendingPaymentOrders: 5,
          toBeConfirmedOrders: 4,
          deliveryInProgressOrders: 4,
          websocketOnlineCount: 4
        }
      ][index];
    }

    async function refresh() {
      if (isDemoLocked()) {
        applyMetrics(mockData());
        setNotice("fallback", "演示模式", "当前展示的是模拟经营数据。");
        return;
      }

      if (ENV.file) {
        applyMetrics(mockData());
        setNotice("fallback", "本地文件", "请改用 http://127.0.0.1/index.html 打开，才能使用真实数据。");
        return;
      }

      const token = getToken();
      if (!token) {
        applyMetrics(mockData());
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
        applyMetrics(payload.data || {});
        setNotice("live", "真实数据", "工作台指标已从实时接口刷新。");
      } catch (error) {
        applyMetrics(mockData());
        setNotice("fallback", "回退演示", `真实接口暂不可用，原因：${error.message}`);
      }
    }

    el.tokenForm.addEventListener("submit", (event) => {
      event.preventDefault();
      localStorage.setItem(KEY.token, normalizeToken(el.tokenInput.value));
      updateTokenUI();
      refresh();
    });

    el.clearBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY.token);
      updateTokenUI();
      refresh();
    });

    el.demoBtn.addEventListener("click", () => {
      if (isDemoLocked()) {
        localStorage.removeItem(KEY.demo);
      } else {
        localStorage.setItem(KEY.demo, "1");
      }
      updateTokenUI();
      refresh();
    });

    updateTokenUI();
    refresh();
    setInterval(refresh, 15000);
  
