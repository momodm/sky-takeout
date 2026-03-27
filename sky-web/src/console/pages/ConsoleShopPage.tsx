import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../shared/api';
import {
  ErrorState,
  InlineNotice,
  MetricCard,
  PageHero,
  SectionTitle,
  StatusPill,
} from '../../shared/components';
import { formatCurrency, formatNumber } from '../../shared/utils';

export function ConsoleShopPage() {
  const queryClient = useQueryClient();
  const shopStatusQuery = useQuery({
    queryKey: ['console', 'shop-status'],
    queryFn: () => adminApi.shopStatus(),
  });
  const overviewQuery = useQuery({
    queryKey: ['console', 'workspace', 'overview'],
    queryFn: () => adminApi.workspaceOverview(),
  });
  const realtimeQuery = useQuery({
    queryKey: ['console', 'workspace', 'realtime'],
    queryFn: () => adminApi.workspaceRealtime(),
  });

  const shopMutation = useMutation({
    mutationFn: (status: number) => adminApi.setShopStatus(status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['console', 'shop-status'] }),
        queryClient.invalidateQueries({ queryKey: ['console', 'workspace'] }),
      ]);
    },
  });

  const isRunning = shopStatusQuery.data === 1;
  const hasError = shopStatusQuery.isError || overviewQuery.isError || realtimeQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Shop"
        title="店铺状态要讲清楚影响面，而不是只放一个开关。"
        description="这页把营业状态、今日压力和经营影响放在一起。打烊以后，顾客端会自动禁止提交订单；开店以后，工作台和订单流会立刻恢复。"
        actions={
          <div className="button-row">
            <button className="button primary" disabled={shopMutation.isPending} onClick={() => shopMutation.mutate(1)} type="button">
              开店营业
            </button>
            <button className="button secondary" disabled={shopMutation.isPending} onClick={() => shopMutation.mutate(0)} type="button">
              立即打烊
            </button>
          </div>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard label="今日订单" value={formatNumber(realtimeQuery.data?.todayOrders)} />
            <MetricCard label="待接单" tone="support" value={formatNumber(realtimeQuery.data?.toBeConfirmedOrders)} />
            <MetricCard label="派送中" value={formatNumber(realtimeQuery.data?.deliveryInProgressOrders)} />
            <MetricCard label="今日营业额" tone="dark" value={formatCurrency(realtimeQuery.data?.todayTurnover)} />
          </div>
        }
      />

      {hasError ? (
        <ErrorState body="店铺状态或工作台接口暂时不可用，请确认后端服务已启动。" title="店铺面板加载失败" />
      ) : (
        <>
          <InlineNotice
            body={
              isRunning
                ? '当前店铺处于营业中，顾客端可以继续加入购物车并提交订单。'
                : '当前店铺已打烊，顾客端仍可浏览，但下单入口会被禁用。'
            }
            title="顾客端联动提示"
            tone={isRunning ? 'live' : 'warning'}
          />

          <div className="grid-2">
            <section className="panel section-card">
              <SectionTitle eyebrow="Current Status" title="当前营业状态" />
              <div className="stack">
                <StatusPill tone={isRunning ? 'live' : 'warning'}>
                  {isRunning ? '营业中' : '打烊中'}
                </StatusPill>
                <p className="soft-copy">
                  {isRunning
                    ? '现在适合重点盯待接单和派送节奏。'
                    : '如果准备做配置调整或菜单维护，现在是更安全的窗口。'}
                </p>
              </div>
            </section>

            <section className="panel section-card">
              <SectionTitle eyebrow="Impact" title="经营影响" />
              <div className="metrics-grid">
                <MetricCard label="菜品总数" value={formatNumber(overviewQuery.data?.dishTotal)} />
                <MetricCard label="上架菜品" tone="support" value={formatNumber(overviewQuery.data?.dishEnabled)} />
                <MetricCard label="套餐总数" value={formatNumber(overviewQuery.data?.setmealTotal)} />
                <MetricCard label="上架套餐" value={formatNumber(overviewQuery.data?.setmealEnabled)} />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
