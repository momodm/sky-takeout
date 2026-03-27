import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EChartsOption } from 'echarts';
import { adminApi, type WsReminderEvent } from '../../shared/api';
import {
  ChartCard,
  ErrorState,
  InlineNotice,
  MetricCard,
  PageHero,
  SectionTitle,
  StatusPill,
} from '../../shared/components';
import { useConsoleShell } from '../ConsoleShell';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  getReadableWsType,
} from '../../shared/utils';

export function ConsoleWorkspacePage() {
  const { viewMode, shopStatus } = useConsoleShell();
  const overviewQuery = useQuery({
    queryKey: ['console', 'workspace', 'overview'],
    queryFn: () => adminApi.workspaceOverview(),
  });
  const realtimeQuery = useQuery({
    queryKey: ['console', 'workspace', 'realtime'],
    queryFn: () => adminApi.workspaceRealtime(),
    refetchInterval: 15_000,
  });
  const orderStatisticsQuery = useQuery({
    queryKey: ['console', 'workspace', 'order-statistics'],
    queryFn: () => adminApi.workspaceOrderStatistics(),
    refetchInterval: 15_000,
  });

  const [events, setEvents] = useState<WsReminderEvent[]>([]);
  const [wsState, setWsState] = useState<'connecting' | 'open' | 'fallback'>('connecting');

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/admin/orders`);

    socket.onopen = () => setWsState('open');
    socket.onerror = () => setWsState('fallback');
    socket.onclose = () => {
      setWsState((current) => (current === 'open' ? 'fallback' : current));
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WsReminderEvent;
        setEvents((current) => [payload, ...current].slice(0, 8));
      } catch {
        setEvents((current) => [{ type: 'unknown', message: event.data }, ...current].slice(0, 8));
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const orderMixOption = useMemo<EChartsOption>(() => {
    const stats = orderStatisticsQuery.data;
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['48%', '72%'],
          label: { color: '#172430' },
          data: [
            { value: stats?.toBeConfirmedOrders ?? 0, name: '待接单' },
            { value: stats?.confirmedOrders ?? 0, name: '已接单' },
            { value: stats?.deliveryInProgressOrders ?? 0, name: '派送中' },
            { value: stats?.completedOrders ?? 0, name: '已完成' },
            { value: stats?.cancelledOrders ?? 0, name: '已取消' },
          ],
          color: ['#ca5f2d', '#1e6f63', '#d29221', '#577590', '#bb4d40'],
        },
      ],
    };
  }, [orderStatisticsQuery.data]);

  const supplyOption = useMemo<EChartsOption>(() => {
    const overview = overviewQuery.data;
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['菜品总数', '上架菜品', '套餐总数', '上架套餐'],
        axisLabel: { color: '#677481' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#677481' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 26,
          data: [
            overview?.dishTotal ?? 0,
            overview?.dishEnabled ?? 0,
            overview?.setmealTotal ?? 0,
            overview?.setmealEnabled ?? 0,
          ],
          itemStyle: {
            borderRadius: [16, 16, 0, 0],
            color: '#ca5f2d',
          },
        },
      ],
    };
  }, [overviewQuery.data]);

  const hasError = overviewQuery.isError || realtimeQuery.isError || orderStatisticsQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Workspace"
        eyebrowTone="support"
        title="把营业状态、订单压力和提醒流放进同一张首屏"
        description="工作台首屏先回答 4 个问题：门店开没开、待接单多不多、提醒链路亮没亮、今天经营有没有起色。"
        actions={
          <div className="button-row">
            <StatusPill tone={shopStatus === 1 ? 'live' : 'warning'}>
              店铺状态：{shopStatus === 1 ? '营业中' : '打烊中'}
            </StatusPill>
            <StatusPill tone={wsState === 'open' ? 'live' : 'warning'}>
              提醒通道：{wsState === 'open' ? '已连接' : wsState === 'connecting' ? '连接中' : '已回退'}
            </StatusPill>
          </div>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard label="今日营业额" tone="support" value={formatCurrency(realtimeQuery.data?.todayTurnover)} />
            <MetricCard label="今日订单" value={formatNumber(realtimeQuery.data?.todayOrders)} />
            <MetricCard label="待接单" value={formatNumber(realtimeQuery.data?.toBeConfirmedOrders)} />
            <MetricCard label="在线连接" value={formatNumber(realtimeQuery.data?.websocketOnlineCount)} />
          </div>
        }
      />

      {hasError ? (
        <ErrorState
          body="工作台统计接口暂时不可用，请先确认后端 8080、Redis 和 WebSocket 代理都已启动。"
          title="工作台数据加载失败"
        />
      ) : (
        <>
          <InlineNotice
            body={viewMode === 'merchant'
              ? '当前是商家运营视图，导航会聚焦接单、菜品、套餐、工作台和报表。'
              : '当前是管理员视图，除了运营台能力，还会展示员工管理。'}
            title="后台视图已就绪"
            tone="live"
          />

          <div className="grid-2">
            <ChartCard
              description="工作台统计接口里的订单分布，会直接影响接单台的节奏判断。"
              eyebrow="Order Mix"
              option={orderMixOption}
              title="订单状态分布"
            />
            <ChartCard
              description="概览接口把菜品、套餐和整体订单量拉到一块，方便老板迅速扫一眼供给盘。"
              eyebrow="Supply"
              option={supplyOption}
              title="菜品与套餐供给"
            />
          </div>

          <section className="panel section-card">
            <SectionTitle eyebrow="Realtime Feed" eyebrowTone="warning" title="来单提醒与实时事件流" />
            {events.length ? (
              <div className="stack">
                {events.map((event, index) => (
                  <article className="order-card" key={`${event.type}-${event.serverTime}-${index}`}>
                    <div className="row-between">
                      <strong>{getReadableWsType(event.type)}</strong>
                      <StatusPill tone="demo">{formatDateTime(event.serverTime)}</StatusPill>
                    </div>
                    <span className="soft-copy">
                      {event.orderNumber ? `订单号 ${event.orderNumber}` : event.message || '系统事件'}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <InlineNotice
                body="如果你刚登录后台但还没有新支付订单，这里会先显示一个空态；等有人支付或催单，消息会立刻进来。"
                title="当前还没有收到实时事件"
                tone={wsState === 'open' ? 'live' : 'warning'}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
