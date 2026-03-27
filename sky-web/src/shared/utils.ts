import type {
  DishFlavor,
  OrderDetail,
  Orders,
  ReportPoint,
  ShoppingCart,
} from './api';

export class ApiError extends Error {
  status: number;
  code: number | null;

  constructor(message: string, status = 500, code: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(Number(value ?? 0));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function createMockCode() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `sky-web-${crypto.randomUUID()}`;
  }

  return `sky-web-${Date.now()}`;
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toDateTimeInput(date: Date) {
  return `${toDateInput(date)}T${date.toTimeString().slice(0, 5)}`;
}

export function startOfDayIso(value: string) {
  return `${value}T00:00:00`;
}

export function endOfDayIso(value: string) {
  return `${value}T23:59:59`;
}

export function splitCsvString(csv: string | null | undefined) {
  if (!csv) {
    return [];
  }

  return csv
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitCsvNumber(csv: string | null | undefined) {
  return splitCsvString(csv).map((item) => Number(item));
}

export function toChartPoints(labelsCsv: string | null | undefined, valuesCsv: string | null | undefined): ReportPoint[] {
  const labels = splitCsvString(labelsCsv);
  const values = splitCsvNumber(valuesCsv);

  return labels.map((label, index) => ({
    label,
    value: values[index] ?? 0,
  }));
}

export function parseFlavorValues(flavor: DishFlavor) {
  if (!flavor.value) {
    return [];
  }

  try {
    const parsed = JSON.parse(flavor.value) as string[];
    return parsed.filter(Boolean);
  } catch {
    return flavor.value
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function buildFlavorSelection(flavors: DishFlavor[], selection: Record<string, string>) {
  return flavors
    .map((flavor) => {
      const option = selection[flavor.name] ?? parseFlavorValues(flavor)[0];
      return option ? `${flavor.name}:${option}` : '';
    })
    .filter(Boolean)
    .join(' / ');
}

export function summarizeCart(cartItems: ShoppingCart[]) {
  return cartItems.reduce(
    (summary, item) => {
      const number = item.number ?? 0;
      const amount = Number(item.amount ?? 0);
      return {
        count: summary.count + number,
        amount: summary.amount + amount * number,
      };
    },
    { count: 0, amount: 0 },
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getErrorMessage(error: unknown, fallback = '操作失败，请稍后再试。') {
  return error instanceof Error ? error.message : fallback;
}

export function getOrderStatusLabel(status: number | null | undefined) {
  switch (status) {
    case 1:
      return '待支付';
    case 2:
      return '待接单';
    case 3:
      return '已接单';
    case 4:
      return '派送中';
    case 5:
      return '已完成';
    case 6:
      return '已取消';
    default:
      return '未知状态';
  }
}

export function getOrderTone(status: number | null | undefined) {
  switch (status) {
    case 2:
    case 3:
    case 4:
      return 'live';
    case 1:
      return 'warning';
    case 6:
      return 'danger';
    default:
      return 'demo';
  }
}

export function getPayStatusLabel(payStatus: number | null | undefined) {
  return payStatus === 1 ? '已支付' : '待支付';
}

export function getReadableWsType(type: string | null | undefined) {
  switch (type) {
    case 'connection_ready':
      return '通道就绪';
    case 'online_count_update':
      return '在线更新';
    case 'new_order':
      return '新支付订单';
    case 'order_reminder':
      return '用户催单';
    default:
      return type || '未知消息';
  }
}

export function describeOrderItems(details: OrderDetail[]) {
  return details.map((detail) => `${detail.name} × ${detail.number}`).join('，');
}

export function getShopStatusLabel(status: number | null | undefined) {
  return status === 1 ? '营业中' : '打烊中';
}

export function getImageFallback(name: string) {
  const text = encodeURIComponent(name || 'Sky');
  return `https://placehold.co/800x600/f5e9da/8c4a28?text=${text}`;
}

export function normalizeImage(url: string | null | undefined, fallbackName: string) {
  return url && url.trim() ? url : getImageFallback(fallbackName);
}

export function normalizeLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function mapDishFlavorLines(lines: string[]) {
  return lines.map((line, index) => {
    const [namePart, valuesPart = ''] = line.split(':');
    const options = valuesPart
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      id: index + 1,
      name: namePart.trim(),
      value: JSON.stringify(options),
    };
  });
}

export function dishFlavorLinesFromEntities(flavors: DishFlavor[] | null | undefined) {
  return (flavors ?? [])
    .map((flavor) => `${flavor.name}: ${parseFlavorValues(flavor).join(' | ')}`)
    .join('\n');
}

export function nextSevenDaysRange() {
  const end = new Date();
  const begin = new Date();
  begin.setDate(end.getDate() - 6);
  return {
    begin: toDateInput(begin),
    end: toDateInput(end),
  };
}

export function getOrderMutationLabel(order: Orders) {
  switch (order.status) {
    case 2:
      return '待接单';
    case 3:
      return '处理中';
    case 4:
      return '配送中';
    default:
      return '订单流转';
  }
}
