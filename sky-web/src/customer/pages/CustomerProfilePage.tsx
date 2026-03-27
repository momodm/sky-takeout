import { Link } from 'react-router-dom';
import { MetricCard, PageHero, SectionTitle } from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { useCustomerShell } from '../CustomerShell';

export function CustomerProfilePage() {
  const { currentUser, shopStatus } = useCustomerShell();

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Profile"
        title={appCopy.customerProfile.heroTitle}
        description={appCopy.customerProfile.heroDescription}
        actions={
          <>
            <Link className="button primary" to="/customer">
              回到点餐首页
            </Link>
            <Link className="button secondary" to="/customer/orders">
              去订单中心
            </Link>
          </>
        }
      />

      <div className="profile-grid grid-2">
        <section className="panel section-card">
          <SectionTitle eyebrow="Session" title="顾客会话" />
          <div className="metrics-grid">
            <MetricCard label="当前用户 ID" value={currentUser ? `#${currentUser.id}` : '未就绪'} />
            <MetricCard label="OpenID" tone="support" value={currentUser?.openid ?? '等待后端返回'} />
            <MetricCard label="门店状态" value={shopStatus === 1 ? '营业中' : '打烊中'} />
            <MetricCard label="前端策略" value="Mock 登录" />
          </div>
        </section>

        <section className="panel section-card">
          <SectionTitle eyebrow="Shortcuts" title="常用入口" />
          <div className="stack">
            <Link className="button secondary" to="/customer/addresses">
              管理地址簿
            </Link>
            <Link className="button secondary" to="/customer/orders">
              查看历史订单
            </Link>
            <a className="button ghost" href="/console" target="_blank">
              打开后台运营台
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
