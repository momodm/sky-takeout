import { useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { userApi, type OrderVO } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  type NoticeTone,
  PageHero,
  StatusPill,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import {
  describeOrderItems,
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOrderStatusLabel,
  getOrderTone,
  getPayStatusLabel,
} from '../../shared/utils';

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
  action?: {
    label: string;
    to: string;
  };
}

interface FlashState {
  flash?: FeedbackState;
}

function formatOrderAddress(record: OrderVO) {
  return record.orders.address || record.orders.consignee || '等待门店补全收货信息';
}

function FeedbackNotice({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) {
    return null;
  }

  return (
    <InlineNotice
      actions={
        feedback.action ? (
          <Link className="button secondary small" to={feedback.action.to}>
            {feedback.action.label}
          </Link>
        ) : undefined
      }
      body={feedback.body}
      title={feedback.title}
      tone={feedback.tone}
    />
  );
}

export function CustomerOrdersPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<FeedbackState | null>(
    () => ((location.state as FlashState | null)?.flash ?? null),
  );
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [isFilterPending, startFilterTransition] = useTransition();

  const rawStatus = searchParams.get('status');
  const rawExpanded = searchParams.get('expanded');
  const parsedStatus = rawStatus === null ? null : Number(rawStatus);
  const parsedExpanded = rawExpanded === null ? null : Number(rawExpanded);
  const status = parsedStatus !== null && Number.isNaN(parsedStatus) ? null : parsedStatus;
  const expandedOrderId = parsedExpanded !== null && Number.isNaN(parsedExpanded) ? null : parsedExpanded;

  const ordersQuery = useQuery({
    queryKey: ['customer', 'orders', status],
    queryFn: () => userApi.historyOrders(1, 20, status),
  });
  const orderDetailQuery = useQuery({
    queryKey: ['customer', 'order-detail', expandedOrderId],
    queryFn: () => userApi.orderDetail(expandedOrderId as number),
    enabled: Boolean(expandedOrderId),
  });

  const updateSearch = (nextStatus: number | null, nextExpanded: number | null = null) => {
    const next = new URLSearchParams(searchParams);

    if (nextStatus === null || Number.isNaN(nextStatus)) {
      next.delete('status');
    } else {
      next.set('status', String(nextStatus));
    }

    if (nextExpanded === null || Number.isNaN(nextExpanded)) {
      next.delete('expanded');
    } else {
      next.set('expanded', String(nextExpanded));
    }

    startFilterTransition(() => {
      setSearchParams(next, { replace: true });
    });
  };

  const refreshCustomerOrderData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'order-detail'] }),
    ]);
  };

  const paymentMutation = useMutation({
    mutationFn: (orderId: number) => userApi.payOrder(orderId),
  });
  const reminderMutation = useMutation({
    mutationFn: (orderId: number) => userApi.reminderOrder(orderId),
  });
  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => userApi.cancelOrder(orderId),
  });
  const repetitionMutation = useMutation({
    mutationFn: (orderId: number) => userApi.repetitionOrder(orderId),
  });

  const runOrderAction = (
    record: OrderVO,
    mutation: typeof paymentMutation,
    options: {
      title: string;
      body: (orderNumber: string) => string;
      action?: FeedbackState['action'];
      refreshList?: boolean;
    },
  ) => {
    setBusyOrderId(record.orders.id);
    mutation.mutate(record.orders.id, {
      onError: (error) => {
        setFeedback({
          title: '操作失败',
          body: getErrorMessage(error),
          tone: 'fallback',
        });
      },
      onSettled: () => {
        setBusyOrderId(null);
      },
      onSuccess: async () => {
        if (options.refreshList ?? true) {
          await refreshCustomerOrderData();
        }
        setFeedback({
          title: options.title,
          body: options.body(record.orders.number),
          tone: 'live',
          action: options.action,
        });
      },
    });
  };

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Order Center"
        title={appCopy.customerOrders.heroTitle}
        description={appCopy.customerOrders.heroDescription}
        actions={
          <div className="tabs">
            {appCopy.customerOrders.filters.map((filter) => (
              <button
                className={`tab-button${status === filter.value ? ' active' : ''}`}
                key={filter.label}
                onClick={() => updateSearch(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      <FeedbackNotice feedback={feedback} />

      {isFilterPending ? (
        <InlineNotice body="正在切换订单筛选结果，稍等一下就会刷新。" title="筛选更新中" tone="live" />
      ) : null}

      {ordersQuery.isLoading ? (
        <LoadingState body="正在读取当前用户的历史订单。" />
      ) : ordersQuery.isError ? (
        <ErrorState body="订单中心接口暂时不可用，请先确认后端 8080 已启动。" title="订单列表加载失败" />
      ) : ordersQuery.data?.records.length ? (
        <div className="stack">
          {ordersQuery.data.records.map((record) => {
            const isExpanded = expandedOrderId === record.orders.id;
            const detailRecord = isExpanded ? orderDetailQuery.data ?? record : record;
            const isBusy = busyOrderId === record.orders.id;

            return (
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

                <span className="soft-copy">{describeOrderItems(detailRecord.orderDetails)}</span>

                <div className="row-between">
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{formatCurrency(record.orders.amount)}</strong>
                    <span className="soft-copy">{formatOrderAddress(record)}</span>
                  </div>
                  <div className="button-row">
                    {record.orders.status === 1 ? (
                      <button
                        className="button primary small"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(record, paymentMutation, {
                            title: appCopy.customerOrders.paymentSuccessTitle,
                            body: appCopy.customerOrders.paymentSuccessBody,
                          })
                        }
                        type="button"
                      >
                        {isBusy ? '处理中…' : appCopy.customerOrders.payAction}
                      </button>
                    ) : null}

                    {[2, 3, 4].includes(record.orders.status) ? (
                      <button
                        className="button secondary small"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(record, reminderMutation, {
                            title: appCopy.customerOrders.remindSuccessTitle,
                            body: appCopy.customerOrders.remindSuccessBody,
                            refreshList: false,
                          })
                        }
                        type="button"
                      >
                        {isBusy ? '处理中…' : appCopy.customerOrders.remindAction}
                      </button>
                    ) : null}

                    {[1, 2].includes(record.orders.status) ? (
                      <button
                        className="button ghost small"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(record, cancelMutation, {
                            title: appCopy.customerOrders.cancelSuccessTitle,
                            body: appCopy.customerOrders.cancelSuccessBody,
                          })
                        }
                        type="button"
                      >
                        {isBusy ? '处理中…' : appCopy.customerOrders.cancelAction}
                      </button>
                    ) : null}

                    <button
                      className="button secondary small"
                      disabled={isBusy}
                      onClick={() =>
                        runOrderAction(record, repetitionMutation, {
                          title: appCopy.customerOrders.repeatSuccessTitle,
                          body: appCopy.customerOrders.repeatSuccessBody,
                          action: {
                            label: appCopy.customerOrders.repeatSuccessAction,
                            to: '/customer',
                          },
                        })
                      }
                      type="button"
                    >
                      {isBusy ? '处理中…' : appCopy.customerOrders.repeatAction}
                    </button>

                    <button
                      className="button ghost small"
                      onClick={() => updateSearch(status, isExpanded ? null : record.orders.id)}
                      type="button"
                    >
                      {isExpanded ? appCopy.customerOrders.detailClose : appCopy.customerOrders.detailOpen}
                    </button>
                  </div>
                </div>

                <div className="detail-stat-grid">
                  <div className="detail-stat">
                    <span>{appCopy.customerOrders.payStatusLabel}</span>
                    <strong>{getPayStatusLabel(record.orders.payStatus)}</strong>
                  </div>
                  <div className="detail-stat">
                    <span>{appCopy.customerOrders.consigneeLabel}</span>
                    <strong>{record.orders.consignee || '未命名'}</strong>
                  </div>
                  <div className="detail-stat">
                    <span>{appCopy.customerOrders.orderAmountLabel}</span>
                    <strong>{formatCurrency(record.orders.amount)}</strong>
                  </div>
                  <div className="detail-stat">
                    <span>{appCopy.customerOrders.deliveryAddressLabel}</span>
                    <strong>{formatOrderAddress(record)}</strong>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="order-detail-panel">
                    {orderDetailQuery.isLoading ? (
                      <LoadingState
                        body={appCopy.customerOrders.detailLoadingBody}
                        title={appCopy.customerOrders.detailLoadingTitle}
                      />
                    ) : orderDetailQuery.isError ? (
                      <InlineNotice
                        body={appCopy.customerOrders.detailErrorBody}
                        title={appCopy.customerOrders.detailErrorTitle}
                        tone="warning"
                      />
                    ) : (
                      <>
                        <div className="order-detail-grid">
                          <div className="stack">
                            <span className="eyebrow support">{appCopy.customerOrders.detailTitle}</span>
                            <div className="detail-meta-grid">
                              <div className="detail-meta-card">
                                <span>{appCopy.customerOrders.deliveryAddressLabel}</span>
                                <strong>{formatOrderAddress(detailRecord)}</strong>
                              </div>
                              <div className="detail-meta-card">
                                <span>{appCopy.customerOrders.remarkLabel}</span>
                                <strong>{detailRecord.orders.remark || '暂无备注'}</strong>
                              </div>
                              <div className="detail-meta-card">
                                <span>{appCopy.customerOrders.packAmountLabel}</span>
                                <strong>{formatCurrency(detailRecord.orders.packAmount)}</strong>
                              </div>
                              <div className="detail-meta-card">
                                <span>{appCopy.customerOrders.tablewareLabel}</span>
                                <strong>{detailRecord.orders.tablewareNumber || 0} 份</strong>
                              </div>
                            </div>
                          </div>

                          <div className="stack">
                            <span className="eyebrow warning">Items</span>
                            <ul className="order-detail-list">
                              {detailRecord.orderDetails.map((detail) => (
                                <li className="order-detail-item" key={detail.id}>
                                  <div className="stack" style={{ gap: 4 }}>
                                    <strong>{detail.name}</strong>
                                    <span className="soft-copy">{detail.dishFlavor || '标准规格'}</span>
                                  </div>
                                  <div className="stack order-detail-item-side" style={{ gap: 4 }}>
                                    <strong>{formatCurrency(detail.amount)}</strong>
                                    <span className="soft-copy">× {detail.number}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {detailRecord.orders.cancelReason ? (
                          <InlineNotice body={detailRecord.orders.cancelReason} title="取消原因" tone="warning" />
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="button secondary" to="/customer">
              {appCopy.customerOrders.gotoMenuAction}
            </Link>
          }
          body={status === null ? appCopy.customerOrders.emptyAllBody : appCopy.customerOrders.emptyFilteredBody}
          title={status === null ? appCopy.customerOrders.emptyAllTitle : appCopy.customerOrders.emptyFilteredTitle}
        />
      )}
    </div>
  );
}
