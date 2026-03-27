import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type Orders } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  MetricCard,
  PageHero,
  SectionTitle,
  StatusPill,
  type NoticeTone,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { formatCurrency, formatDateTime, getErrorMessage, getOrderMutationLabel, getOrderStatusLabel, getOrderTone, startOfDayIso } from '../../shared/utils';

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
}

function nextOrderAction(order: Orders) {
  if (order.status === 2) {
    return {
      label: '接单',
      mutation: 'confirm' as const,
    };
  }

  if (order.status === 3) {
    return {
      label: '派送',
      mutation: 'delivery' as const,
    };
  }

  if (order.status === 4) {
    return {
      label: '完成',
      mutation: 'complete' as const,
    };
  }

  return null;
}

export function ConsoleOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const deferredFilters = useDeferredValue({ status, number, phone, page, pageSize });

  const ordersQuery = useQuery({
    queryKey: ['console', 'orders', deferredFilters],
    queryFn: () => adminApi.searchOrders(deferredFilters),
  });

  const selectedOrderQuery = useQuery({
    queryKey: ['console', 'order-details', selectedOrderId],
    queryFn: () => adminApi.orderDetails(selectedOrderId as number),
    enabled: Boolean(selectedOrderId),
  });

  const summaryQuery = useQuery({
    queryKey: ['console', 'workspace', 'order-statistics', 'today'],
    queryFn: () => adminApi.workspaceOrderStatistics(startOfDayIso(new Date().toISOString().slice(0, 10))),
  });

  const invalidateOrders = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['console', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['console', 'workspace'] }),
      queryClient.invalidateQueries({ queryKey: ['console', 'order-details'] }),
    ]);
  };

  const confirmMutation = useMutation({
    mutationFn: (id: number) => adminApi.confirmOrder(id),
  });
  const deliveryMutation = useMutation({
    mutationFn: (id: number) => adminApi.deliveryOrder(id),
  });
  const completeMutation = useMutation({
    mutationFn: (id: number) => adminApi.completeOrder(id),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectOrder(id, '前台拒单操作'),
  });
  const cancelMutation = useMutation({
    mutationFn: (id: number) => adminApi.cancelOrder(id, '后台主动取消订单'),
  });

  const runOrderMutation = (
    actionLabel: string,
    order: Orders,
    mutation: typeof confirmMutation,
  ) => {
    mutation.mutate(order.id, {
      onError: (error) => {
        setFeedback({
          title: appCopy.consoleFeedback.orderActionErrorTitle(actionLabel),
          body: getErrorMessage(error),
          tone: 'fallback',
        });
      },
      onSuccess: async () => {
        await invalidateOrders();
        setFeedback({
          title: `订单已${actionLabel}`,
          body: appCopy.consoleFeedback.orderActionSuccess(actionLabel, order.number),
          tone: 'live',
        });
      },
    });
  };

  const selectedOrder = selectedOrderQuery.data;
  const totals = useMemo(() => summaryQuery.data, [summaryQuery.data]);
  const hasError = ordersQuery.isError || summaryQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Orders"
        eyebrowTone="warning"
        title="订单页优先解决状态流转和详情联动"
        description="这页直接连 conditionSearch、details、confirm、rejection、cancel、delivery、complete，把商家端最关键的流转闭环先做真。"
        aside={
          <div className="metrics-grid">
            <MetricCard label="待支付" value={totals?.pendingPaymentOrders ?? 0} />
            <MetricCard label="待接单" tone="support" value={totals?.toBeConfirmedOrders ?? 0} />
            <MetricCard label="派送中" value={totals?.deliveryInProgressOrders ?? 0} />
            <MetricCard label="今日营业额" tone="dark" value={formatCurrency(totals?.turnover)} />
          </div>
        }
      />

      {feedback ? <InlineNotice body={feedback.body} title={feedback.title} tone={feedback.tone} /> : null}

      <section className="panel section-card">
        <SectionTitle eyebrow="Filters" title="筛选条件" />
        <div className="field-grid">
          <div className="field">
            <label htmlFor="orderNumber">订单号</label>
            <input id="orderNumber" onChange={(event) => setNumber(event.target.value)} value={number} />
          </div>
          <div className="field">
            <label htmlFor="orderPhone">手机号</label>
            <input id="orderPhone" onChange={(event) => setPhone(event.target.value)} value={phone} />
          </div>
          <div className="field">
            <label htmlFor="orderStatus">状态</label>
            <select
              id="orderStatus"
              onChange={(event) => setStatus(event.target.value ? Number(event.target.value) : undefined)}
              value={status ?? ''}
            >
              <option value="">全部</option>
              <option value="1">待支付</option>
              <option value="2">待接单</option>
              <option value="3">已接单</option>
              <option value="4">派送中</option>
              <option value="5">已完成</option>
              <option value="6">已取消</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="page">页码</label>
            <input id="page" min="1" onChange={(event) => setPage(Number(event.target.value) || 1)} type="number" value={page} />
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="table-card panel">
          <SectionTitle eyebrow="Queue" title="订单队列" />
          {hasError ? (
            <ErrorState body="订单列表或统计接口暂时不可用，请先确认后端 8080 已启动。" title="订单队列加载失败" />
          ) : ordersQuery.isLoading ? (
            <LoadingState body="正在读取后台订单分页结果。" />
          ) : ordersQuery.data?.records.length ? (
            <div className="stack">
              {ordersQuery.data.records.map((order) => {
                const action = nextOrderAction(order);
                return (
                  <article className="order-card" key={order.id}>
                    <div className="row-between">
                      <div className="stack" style={{ gap: 4 }}>
                        <strong>{order.number}</strong>
                        <span className="soft-copy">{formatDateTime(order.orderTime)}</span>
                      </div>
                      <StatusPill tone={getOrderTone(order.status)}>{getOrderStatusLabel(order.status)}</StatusPill>
                    </div>
                    <div className="row-between">
                      <span className="soft-copy">{order.consignee || '匿名顾客'} · {order.phone || '无手机号'}</span>
                      <strong>{formatCurrency(order.amount)}</strong>
                    </div>
                    <div className="button-row">
                      <button className="button secondary small" onClick={() => setSelectedOrderId(order.id)} type="button">
                        查看详情
                      </button>
                      {action ? (
                        <button
                          className="button primary small"
                          onClick={() => {
                            if (action.mutation === 'confirm') runOrderMutation('接单', order, confirmMutation);
                            if (action.mutation === 'delivery') runOrderMutation('派送', order, deliveryMutation);
                            if (action.mutation === 'complete') runOrderMutation('完成', order, completeMutation);
                          }}
                          type="button"
                        >
                          {action.label}
                        </button>
                      ) : null}
                      {order.status === 2 ? (
                        <button className="button ghost small" onClick={() => runOrderMutation('拒单', order, rejectMutation)} type="button">
                          拒单
                        </button>
                      ) : null}
                      {[1, 2, 3].includes(order.status) ? (
                        <button className="button danger small" onClick={() => runOrderMutation('取消', order, cancelMutation)} type="button">
                          取消
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState body="当前筛选条件下没有匹配订单。" title="没有订单结果" />
          )}
        </section>

        <section className="table-card panel">
          <SectionTitle
            actions={
              selectedOrder ? <StatusPill tone={getOrderTone(selectedOrder.orders.status)}>{getOrderMutationLabel(selectedOrder.orders)}</StatusPill> : null
            }
            eyebrow="Details"
            title="订单详情"
          />
          {selectedOrderQuery.isError ? (
            <ErrorState body="订单详情接口暂时不可用，请稍后再试。" title="订单详情加载失败" />
          ) : selectedOrderQuery.isLoading ? (
            <LoadingState body="正在读取订单详情与明细。" />
          ) : selectedOrder ? (
            <div className="stack">
              <div className="grid-2">
                <MetricCard label="订单号" value={selectedOrder.orders.number} />
                <MetricCard label="状态" value={getOrderStatusLabel(selectedOrder.orders.status)} />
                <MetricCard label="收货人" value={selectedOrder.orders.consignee || '未命名'} />
                <MetricCard label="金额" tone="support" value={formatCurrency(selectedOrder.orders.amount)} />
              </div>
              {selectedOrder.orderDetails.map((detail) => (
                <article className="order-card" key={detail.id}>
                  <div className="row-between">
                    <strong>{detail.name}</strong>
                    <span>{formatCurrency(detail.amount)}</span>
                  </div>
                  <span className="soft-copy">{detail.dishFlavor || '标准规格'} · {detail.number} 份</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="点左侧任一订单，这里会立即联动详情。" title="还没有选中订单" />
          )}
        </section>
      </div>
    </div>
  );
}
