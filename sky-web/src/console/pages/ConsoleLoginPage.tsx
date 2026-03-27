import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../../shared/api';
import { InlineNotice } from '../../shared/components';
import { setAdminProfile, setAdminToken } from '../../shared/storage';

export function ConsoleLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  const loginMutation = useMutation({
    mutationFn: () => adminApi.login({ username, password }),
    onSuccess: (session) => {
      setAdminToken(session.token);
      setAdminProfile({
        id: session.id,
        name: session.name,
        userName: session.userName,
      });
      const from = (location.state as { from?: string } | null)?.from || '/console/workspace';
      navigate(from, { replace: true });
    },
  });

  return (
    <main className="login-shell">
      <section className="login-card panel">
        <div className="login-brand">
          <span className="eyebrow">Sky Console</span>
          <h1>把运营台、报表和管理动作放进一套真正能联调的后台。</h1>
          <p className="soft-copy">
            登录页继续沿用当前后端的员工账号体系，拿到的 token 会自动用于 /api/admin 和 /ws/admin/orders。
          </p>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-dot accent" />
              <span className="soft-copy">商家运营视图：工作台、来单提醒、订单流转</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot support" />
              <span className="soft-copy">管理员视图：再叠加员工、分类、报表和系统概览</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot warning" />
              <span className="soft-copy">品牌化产品风，不走默认 SaaS 模板外观</span>
            </div>
          </div>
        </div>

        <div className="login-form">
          <span className="eyebrow support">Admin Login</span>
          <h1 style={{ fontSize: 'clamp(34px, 4vw, 54px)' }}>先登录，再接经营链路。</h1>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div className="field">
              <label htmlFor="username">账号</label>
              <input
                autoComplete="username"
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                value={username}
              />
            </div>
            <div className="field">
              <label htmlFor="password">密码</label>
              <input
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>
            <button className="button primary block" disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? '登录中…' : '进入运营台'}
            </button>
          </form>
          {loginMutation.isError ? (
            <InlineNotice
              body={(loginMutation.error as Error).message}
              title="登录失败"
              tone="fallback"
            />
          ) : (
            <InlineNotice
              body="默认开发账号一般是 admin / 123456。登录成功后，后台会自动注入 token。"
              title="当前接入后端员工登录接口"
              tone="live"
            />
          )}
        </div>
      </section>
    </main>
  );
}
