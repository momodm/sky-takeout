import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, type OrderVO } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHero,
  StatusPill,
} from '../../shared/components';
import {
  describeOrderItems,
  formatCurrency,
  formatDateTime,
  getOrderStatusLabel,
  getOrderTone,
} from '../../shared/utils';

const ORDER_FILTERS = [
  { label: '全部订单', value: null },
  { label: '待支付', value: 1 },
  { label: '待接单', value: 2 },
  { label: '派送中', value: 4 },
  { label: '已完成', value: 5 },
  { label: '已取消', value: 6 },
];

export function CustomerOrdersPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<number | null>(null);
  const ordersQuery = useQuery({
    queryKey: ['customer', 'orders', status],
    queryFn: () => userApi.historyOrders(1, 20, status),
  });

  const refreshCustomerOrderData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] }),
    ]);
  };

  const paymentMutation = useMutation({
    mutationFn: (orderId: number) => userApi.payOrder(orderId),
    onSuccess: refreshCustomerOrderData,
  });
  const reminderMutation = useMutation({
    mutationFn: (orderId: number) => userApi.reminderOrder(orderId),
  });
  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => userApi.cancelOrder(orderId),
    onSuccess: refreshCustomerOrderData,
  });
  const repetitionMutation = useMutation({
    mutationFn: (orderId: number) => userApi.repetitionOrder(orderId),
    onSuccess: refreshCustomerOrderData,
  });

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Order Center"
        title="订单中心会把真实状态、支付、催单和再来一单连起来"
        description="这里直接使用 historyOrders / orderDetail / payment / reminder / cancel / repetition，顾客端常用动作都能在一页里演练。"
        actions={
          <div className="tabs">
            {ORDER_FILTERS.map((filter) => (
              <button
                className={`tab-button${status === filter.value ? ' active' : ''}`}
                key={filter.label}
                onClick={() => setStatus(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      {ordersQuery.isLoading ? (
        <LoadingState body="正在读取当前用户的历史订单。" />
      ) : ordersQuery.isError ? (
        <ErrorState body="订单中心接口暂时不可用，请先确认后端 8080 已启动。" title="订单列表加载失败" />
      ) : ordersQuery.data?.records.length ? (
        <div className="stack">
          {ordersQuery.data.records.map((record: OrderVO) => (
            <article className="order-card panel-subtle" key={record.orders.id}>
              <div className="row-between">
                <div className="stack" style={{ gap: 4 }}>
                  <strong>订单号 {record.orders.number}</strong>
                  <span className="soft-copy">{formatDateTime(record.orders.orderTime)}</span>
                </div>
                <StatusPill tone={getOrderTone(record.orders.status)}>
                  {getOrderStatusLabel(record.orders.status)}
                </StatusPill>
              </div>
              <span className="soft-copy">{describeOrderItems(record.orderDetails)}</span>
              <div className="row-between">
                <strong>{formatCurrency(record.orders.amount)}</strong>
                <div className="button-row">
                  {record.orders.status === 1 ? (
                    <button className="button primary small" onClick={() => paymentMutation.mutate(record.orders.id)} type="button">
                      立即支付
                    </button>
                  ) : null}
                  {[2, 3, 4].includes(record.orders.status) ? (
                    <button className="button secondary small" onClick={() => reminderMutation.mutate(record.orders.id)} type="button">
                      催单
                    </button>
                  ) : null}
                  {[1, 2].includes(record.orders.status) ? (
                    <button className="button ghost small" onClick={() => cancelMutation.mutate(record.orders.id)} type="button">
                      取消
                    </button>
                  ) : null}
                  <button className="button secondary small" onClick={() => repetitionMutation.mutate(record.orders.id)} type="button">
                    再来一单
                  </button>
                </div>
              </div>
              <div className="grid-2">
                <MetricCard label="支付状态" value={record.orders.payStatus === 1 ? '已支付' : '待支付'} />
                <MetricCard label="收货信息" value={record.orders.consignee || '未命名'} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState body="先去首页点一单，订单中心才会开始出现真实内容。" title="当前筛选条件下没有订单" />
      )}
    </div>
  );
}
