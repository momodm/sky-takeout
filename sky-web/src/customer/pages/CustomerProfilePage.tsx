import { Link } from 'react-router-dom';
import { MetricCard, PageHero, SectionTitle, StatusPill } from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { getUserToken } from '../../shared/storage';
import { useCustomerShell } from '../CustomerShell';

export function CustomerProfilePage() {
  const { currentUser, shopStatus, sessionReady } = useCustomerShell();
  const hasToken = Boolean(getUserToken());

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Profile"
        eyebrowTone="support"
        title={appCopy.customerProfile.heroTitle}
        description={appCopy.customerProfile.heroDescription}
        actions={
          <div className="button-row">
            <Link className="button primary" to="/customer/orders">
              查看订单
            </Link>
            <Link className="button secondary" to="/customer/addresses">
              管理地址
            </Link>
          </div>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard label="会话状态" value={sessionReady ? '已就绪' : '初始化中'} />
            <MetricCard label="顾客编号" tone="support" value={currentUser ? `#${currentUser.id}` : '未连接'} />
            <MetricCard label="门店状态" value={shopStatus === 1 ? '营业中' : '打烊中'} />
            <MetricCard label="Token 状态" tone="dark" value={hasToken ? '已写入' : '未写入'} />
          </div>
        }
      />

      <section className="panel section-card">
        <SectionTitle
          eyebrow="Session"
          title={appCopy.customerProfile.sessionTitle}
          description={appCopy.customerProfile.sessionBody}
          actions={
            <StatusPill tone={sessionReady ? 'live' : 'warning'}>
              {sessionReady ? '已连接真实用户会话' : '正在等待会话就绪'}
            </StatusPill>
          }
        />
        <div className="grid-2">
          <MetricCard label="用户 OpenID" value={currentUser?.openid || '当前尚未返回'} />
          <MetricCard
            label="当前入口"
            tone="support"
            value={shopStatus === 1 ? '可继续点餐与结算' : '可浏览但暂不可下单'}
          />
        </div>
      </section>

      <section className="panel section-card">
        <SectionTitle
          eyebrow="Shortcuts"
          eyebrowTone="warning"
          title={appCopy.customerProfile.actionsTitle}
          description={appCopy.customerProfile.actionsBody}
        />
        <div className="cards-grid">
          <article className="order-card panel-subtle">
            <strong>继续点餐</strong>
            <span className="soft-copy">回到点餐首页，继续浏览菜品、套餐和购物车。</span>
            <Link className="button primary small" to="/customer">
              回到首页
            </Link>
          </article>
          <article className="order-card panel-subtle">
            <strong>处理订单</strong>
            <span className="soft-copy">查看待支付、履约中、已完成和已取消的订单。</span>
            <Link className="button secondary small" to="/customer/orders">
              打开订单中心
            </Link>
          </article>
          <article className="order-card panel-subtle">
            <strong>完善地址</strong>
            <span className="soft-copy">补默认地址后，下单链路会更顺，不会在结算时卡住。</span>
            <Link className="button secondary small" to="/customer/addresses">
              打开地址簿
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
