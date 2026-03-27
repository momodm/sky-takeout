import {
  clearAdminSession,
  getAdminToken,
  getUserToken,
  type AdminProfile,
} from './storage';
import { ApiError } from './utils';

type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | Primitive[];
type Query = Record<string, QueryValue>;

interface ApiEnvelope<T> {
  code: number;
  msg: string | null;
  data: T;
}

interface RequestOptions {
  method?: string;
  body?: BodyInit | object | null;
  headers?: HeadersInit;
  query?: Query;
  auth?: 'user' | 'admin' | 'none';
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(path, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, rawValue]) => {
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return;
      }

      if (Array.isArray(rawValue)) {
        rawValue.forEach((item) => {
          if (item !== null && item !== undefined && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
        return;
      }

      url.searchParams.set(key, String(rawValue));
    });
  }

  return url.toString();
}

function buildHeaders(auth: RequestOptions['auth'], headers?: HeadersInit) {
  const result = new Headers(headers);

  if (auth === 'user') {
    const token = getUserToken();
    if (token) {
      result.set('authentication', token);
    }
  }

  if (auth === 'admin') {
    const token = getAdminToken();
    if (token) {
      result.set('token', token);
    }
  }

  return result;
}

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return (await response.json()) as ApiEnvelope<T>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body = null, headers, query, auth = 'none' } = options;
  const requestHeaders = buildHeaders(auth, headers);
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body && typeof body === 'object') {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  } else if (typeof body === 'string') {
    requestBody = body;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const json = await parseJson<T>(response);
  if (!response.ok) {
    const message = json?.msg || `请求失败 (${response.status})`;
    if (response.status === 401 && auth === 'admin') {
      clearAdminSession();
    }
    throw new ApiError(message, response.status, json?.code ?? null);
  }

  if (!json) {
    throw new ApiError('接口返回格式异常', response.status, null);
  }

  if (json.code !== 1) {
    throw new ApiError(json.msg || '操作失败', response.status, json.code);
  }

  return json.data;
}

async function requestBlob(path: string, options: RequestOptions = {}) {
  const { method = 'GET', headers, query, auth = 'none' } = options;
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: buildHeaders(auth, headers),
  });

  if (!response.ok) {
    throw new ApiError(`下载失败 (${response.status})`, response.status, null);
  }

  return response.blob();
}

export interface PageResult<T> {
  total: number;
  records: T[];
}

export interface Category {
  id: number;
  type: number;
  name: string;
  sort: number;
  status: number;
}

export interface DishFlavor {
  id?: number;
  dishId?: number;
  name: string;
  value: string;
}

export interface Dish {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
  updateTime?: string;
}

export interface DishVO extends Dish {
  categoryName?: string;
  flavors: DishFlavor[];
}

export interface Setmeal {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  status: number;
  description: string;
  image: string;
  updateTime?: string;
}

export interface SetmealDish {
  id?: number;
  setmealId?: number;
  dishId: number;
  name?: string;
  price?: number;
  copies: number;
}

export interface SetmealVO extends Setmeal {
  categoryName?: string;
  setmealDishes: SetmealDish[];
}

export interface ShoppingCart {
  id: number;
  name: string;
  image: string;
  userId: number;
  dishId?: number;
  setmealId?: number;
  dishFlavor?: string;
  number: number;
  amount: number;
  createTime?: string;
}

export interface AddressBook {
  id: number;
  userId?: number;
  consignee: string;
  sex: string;
  phone: string;
  provinceCode?: string;
  provinceName: string;
  cityCode?: string;
  cityName: string;
  districtCode?: string;
  districtName: string;
  detail: string;
  label: string;
  isDefault: number;
}

export interface Orders {
  id: number;
  number: string;
  status: number;
  userId: number;
  addressBookId: number;
  orderTime: string;
  checkoutTime?: string;
  payMethod: number;
  payStatus: number;
  amount: number;
  remark?: string;
  phone?: string;
  address?: string;
  consignee?: string;
  cancelReason?: string;
  rejectionReason?: string;
  cancelTime?: string;
  estimatedDeliveryTime?: string;
  deliveryStatus?: number;
  deliveryTime?: string;
  packAmount?: number;
  tablewareNumber?: number;
}

export interface OrderDetail {
  id: number;
  name: string;
  image: string;
  orderId: number;
  dishId?: number;
  setmealId?: number;
  dishFlavor?: string;
  number: number;
  amount: number;
}

export interface OrderVO {
  orders: Orders;
  orderDetails: OrderDetail[];
}

export interface OrderSubmitVO {
  id: number;
  orderNumber: string;
  orderAmount: number;
  orderTime: string;
}

export interface EmployeeVO {
  id: number;
  username: string;
  name: string;
  phone: string;
  sex: string;
  idNumber: string;
  status: number;
}

export interface EmployeeLoginVO extends AdminProfile {
  token: string;
}

export interface WorkspaceOverviewVO {
  dishTotal: number;
  dishEnabled: number;
  setmealTotal: number;
  setmealEnabled: number;
  totalOrders: number;
  toBeConfirmedOrders: number;
  deliveryInProgressOrders: number;
  completedOrders: number;
  turnover: number;
}

export interface WorkspaceRealtimeVO {
  websocketOnlineCount: number;
  pendingPaymentOrders: number;
  toBeConfirmedOrders: number;
  deliveryInProgressOrders: number;
  todayOrders: number;
  todayTurnover: number;
  todayUsers: number;
  todayCompletionRate: number;
}

export interface OrderStatisticsVO {
  totalOrders: number;
  pendingPaymentOrders: number;
  toBeConfirmedOrders: number;
  confirmedOrders: number;
  deliveryInProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  turnover: number;
}

export interface TurnoverReportVO {
  dateList: string;
  turnoverList: string;
}

export interface UserReportVO {
  dateList: string;
  newUserList: string;
  totalUserList: string;
}

export interface OrderReportVO {
  dateList: string;
  orderCountList: string;
  validOrderCountList: string;
  totalOrderCount: number;
  validOrderCount: number;
  orderCompletionRate: number;
}

export interface SalesTop10ReportVO {
  nameList: string;
  numberList: string;
}

export interface UserLoginVO {
  id: number;
  openid: string;
  token: string;
}

export interface User {
  id: number;
  openid: string;
  createTime?: string;
}

export interface WsReminderEvent {
  type: string;
  message?: string;
  orderId?: number;
  orderNumber?: string;
  status?: number;
  onlineCount?: number;
  serverTime?: string;
  toBeConfirmedOrders?: number;
}

export interface ReportPoint {
  label: string;
  value: number;
}

export interface EmployeeDTO {
  id?: number;
  username: string;
  name: string;
  phone: string;
  sex: string;
  idNumber: string;
}

export interface CategoryDTO {
  id?: number;
  type: number;
  name: string;
  sort: number;
}

export interface DishDTO {
  id?: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
  flavors: DishFlavor[];
}

export interface SetmealDTO {
  id?: number;
  categoryId: number;
  name: string;
  price: number;
  image: string;
  description: string;
  status: number;
  setmealDishes: SetmealDish[];
}

export interface OrdersSubmitDTO {
  addressBookId: number;
  remark?: string;
  payMethod: number;
  estimatedDeliveryTime?: string;
  packAmount: number;
  tablewareNumber: number;
}

export const userApi = {
  login(code: string) {
    return request<UserLoginVO>('/api/user/user/login', {
      method: 'POST',
      body: { code },
    });
  },
  current() {
    return request<User>('/api/user/user/current', { auth: 'user' });
  },
  shopStatus() {
    return request<number>('/api/user/shop/status');
  },
  categories(type: number) {
    return request<Category[]>('/api/user/category/list', {
      auth: 'user',
      query: { type },
    });
  },
  dishes(categoryId: number) {
    return request<DishVO[]>('/api/user/dish/list', {
      auth: 'user',
      query: { categoryId },
    });
  },
  setmeals(categoryId: number) {
    return request<Setmeal[]>('/api/user/setmeal/list', {
      auth: 'user',
      query: { categoryId },
    });
  },
  cartList() {
    return request<ShoppingCart[]>('/api/user/shoppingCart/list', { auth: 'user' });
  },
  cartAdd(payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) {
    return request<ShoppingCart>('/api/user/shoppingCart/add', {
      method: 'POST',
      auth: 'user',
      body: payload,
    });
  },
  cartSub(payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) {
    return request<ShoppingCart>('/api/user/shoppingCart/sub', {
      method: 'POST',
      auth: 'user',
      body: payload,
    });
  },
  cartClean() {
    return request<void>('/api/user/shoppingCart/clean', {
      method: 'DELETE',
      auth: 'user',
    });
  },
  addressList() {
    return request<AddressBook[]>('/api/user/addressBook/list', { auth: 'user' });
  },
  addressDefault() {
    return request<AddressBook>('/api/user/addressBook/default', { auth: 'user' });
  },
  addressById(id: number) {
    return request<AddressBook>(`/api/user/addressBook/${id}`, { auth: 'user' });
  },
  saveAddress(payload: Omit<AddressBook, 'id'>) {
    return request<AddressBook>('/api/user/addressBook', {
      method: 'POST',
      auth: 'user',
      body: payload,
    });
  },
  updateAddress(payload: AddressBook) {
    return request<void>('/api/user/addressBook', {
      method: 'PUT',
      auth: 'user',
      body: payload,
    });
  },
  setDefaultAddress(id: number) {
    return request<AddressBook>('/api/user/addressBook/default', {
      method: 'PUT',
      auth: 'user',
      body: { id },
    });
  },
  deleteAddress(id: number) {
    return request<void>('/api/user/addressBook', {
      method: 'DELETE',
      auth: 'user',
      query: { id },
    });
  },
  submitOrder(payload: OrdersSubmitDTO) {
    return request<OrderSubmitVO>('/api/user/order/submit', {
      method: 'POST',
      auth: 'user',
      body: payload,
    });
  },
  historyOrders(page: number, pageSize: number, status?: number | null) {
    return request<PageResult<OrderVO>>('/api/user/order/historyOrders', {
      auth: 'user',
      query: { page, pageSize, status: status ?? undefined },
    });
  },
  orderDetail(id: number) {
    return request<OrderVO>(`/api/user/order/orderDetail/${id}`, { auth: 'user' });
  },
  payOrder(id: number) {
    return request<void>(`/api/user/order/payment/${id}`, {
      method: 'PUT',
      auth: 'user',
    });
  },
  reminderOrder(id: number) {
    return request<void>(`/api/user/order/reminder/${id}`, {
      method: 'PUT',
      auth: 'user',
    });
  },
  cancelOrder(id: number) {
    return request<void>(`/api/user/order/cancel/${id}`, {
      method: 'PUT',
      auth: 'user',
    });
  },
  repetitionOrder(id: number) {
    return request<void>(`/api/user/order/repetition/${id}`, {
      method: 'PUT',
      auth: 'user',
    });
  },
};

export const adminApi = {
  login(payload: { username: string; password: string }) {
    return request<EmployeeLoginVO>('/api/admin/employee/login', {
      method: 'POST',
      body: payload,
    });
  },
  employeePage(page: number, pageSize: number, name?: string) {
    return request<PageResult<EmployeeVO>>('/api/admin/employee/page', {
      auth: 'admin',
      query: { page, pageSize, name },
    });
  },
  saveEmployee(payload: EmployeeDTO) {
    return request<void>('/api/admin/employee', {
      method: 'POST',
      auth: 'admin',
      body: payload,
    });
  },
  updateEmployee(payload: EmployeeDTO) {
    return request<void>('/api/admin/employee', {
      method: 'PUT',
      auth: 'admin',
      body: payload,
    });
  },
  employeeStatus(status: number, id: number) {
    return request<void>(`/api/admin/employee/status/${status}`, {
      method: 'POST',
      auth: 'admin',
      query: { id },
    });
  },
  categoryPage(page: number, pageSize: number, type?: number, name?: string) {
    return request<PageResult<Category>>('/api/admin/category/page', {
      auth: 'admin',
      query: { page, pageSize, type, name },
    });
  },
  categoryList(type?: number) {
    return request<Category[]>('/api/admin/category/list', {
      auth: 'admin',
      query: { type },
    });
  },
  saveCategory(payload: CategoryDTO) {
    return request<void>('/api/admin/category', {
      method: 'POST',
      auth: 'admin',
      body: payload,
    });
  },
  updateCategory(payload: CategoryDTO) {
    return request<void>('/api/admin/category', {
      method: 'PUT',
      auth: 'admin',
      body: payload,
    });
  },
  deleteCategory(id: number) {
    return request<void>('/api/admin/category', {
      method: 'DELETE',
      auth: 'admin',
      query: { id },
    });
  },
  categoryStatus(status: number, id: number) {
    return request<void>(`/api/admin/category/status/${status}`, {
      method: 'POST',
      auth: 'admin',
      query: { id },
    });
  },
  dishPage(page: number, pageSize: number, name?: string, categoryId?: number) {
    return request<PageResult<DishVO>>('/api/admin/dish/page', {
      auth: 'admin',
      query: { page, pageSize, name, categoryId },
    });
  },
  dishById(id: number) {
    return request<DishVO>(`/api/admin/dish/${id}`, { auth: 'admin' });
  },
  saveDish(payload: DishDTO) {
    return request<void>('/api/admin/dish', {
      method: 'POST',
      auth: 'admin',
      body: payload,
    });
  },
  updateDish(payload: DishDTO) {
    return request<void>('/api/admin/dish', {
      method: 'PUT',
      auth: 'admin',
      body: payload,
    });
  },
  deleteDishes(ids: number[]) {
    return request<void>('/api/admin/dish', {
      method: 'DELETE',
      auth: 'admin',
      query: { ids },
    });
  },
  dishStatus(status: number, id: number) {
    return request<void>(`/api/admin/dish/status/${status}`, {
      method: 'POST',
      auth: 'admin',
      query: { id },
    });
  },
  setmealPage(page: number, pageSize: number, name?: string, categoryId?: number) {
    return request<PageResult<SetmealVO>>('/api/admin/setmeal/page', {
      auth: 'admin',
      query: { page, pageSize, name, categoryId },
    });
  },
  setmealById(id: number) {
    return request<SetmealVO>(`/api/admin/setmeal/${id}`, { auth: 'admin' });
  },
  saveSetmeal(payload: SetmealDTO) {
    return request<void>('/api/admin/setmeal', {
      method: 'POST',
      auth: 'admin',
      body: payload,
    });
  },
  updateSetmeal(payload: SetmealDTO) {
    return request<void>('/api/admin/setmeal', {
      method: 'PUT',
      auth: 'admin',
      body: payload,
    });
  },
  deleteSetmeals(ids: number[]) {
    return request<void>('/api/admin/setmeal', {
      method: 'DELETE',
      auth: 'admin',
      query: { ids },
    });
  },
  setmealStatus(status: number, id: number) {
    return request<void>(`/api/admin/setmeal/status/${status}`, {
      method: 'POST',
      auth: 'admin',
      query: { id },
    });
  },
  shopStatus() {
    return request<number>('/api/admin/shop/status', { auth: 'admin' });
  },
  setShopStatus(status: number) {
    return request<void>(`/api/admin/shop/${status}`, {
      method: 'PUT',
      auth: 'admin',
    });
  },
  workspaceOverview() {
    return request<WorkspaceOverviewVO>('/api/admin/workspace/overview', { auth: 'admin' });
  },
  workspaceRealtime() {
    return request<WorkspaceRealtimeVO>('/api/admin/workspace/realtime', { auth: 'admin' });
  },
  workspaceOrderStatistics(beginTime?: string, endTime?: string) {
    return request<OrderStatisticsVO>('/api/admin/workspace/orderStatistics', {
      auth: 'admin',
      query: { beginTime, endTime },
    });
  },
  searchOrders(payload: {
    page: number;
    pageSize: number;
    status?: number;
    number?: string;
    phone?: string;
    beginTime?: string;
    endTime?: string;
  }) {
    return request<PageResult<Orders>>('/api/admin/order/conditionSearch', {
      auth: 'admin',
      query: payload,
    });
  },
  orderDetails(id: number) {
    return request<OrderVO>(`/api/admin/order/details/${id}`, { auth: 'admin' });
  },
  confirmOrder(id: number) {
    return request<void>('/api/admin/order/confirm', {
      method: 'PUT',
      auth: 'admin',
      body: { id },
    });
  },
  rejectOrder(id: number, rejectionReason: string) {
    return request<void>('/api/admin/order/rejection', {
      method: 'PUT',
      auth: 'admin',
      body: { id, rejectionReason },
    });
  },
  cancelOrder(id: number, cancelReason: string) {
    return request<void>('/api/admin/order/cancel', {
      method: 'PUT',
      auth: 'admin',
      body: { id, cancelReason },
    });
  },
  deliveryOrder(id: number) {
    return request<void>(`/api/admin/order/delivery/${id}`, {
      method: 'PUT',
      auth: 'admin',
    });
  },
  completeOrder(id: number) {
    return request<void>(`/api/admin/order/complete/${id}`, {
      method: 'PUT',
      auth: 'admin',
    });
  },
  uploadFile(file: File) {
    const formData = new FormData();
    formData.set('file', file);
    return request<string>('/api/admin/common/upload', {
      method: 'POST',
      auth: 'admin',
      body: formData,
    });
  },
  turnoverReport(begin: string, end: string) {
    return request<TurnoverReportVO>('/api/admin/report/turnoverStatistics', {
      auth: 'admin',
      query: { begin, end },
    });
  },
  userReport(begin: string, end: string) {
    return request<UserReportVO>('/api/admin/report/userStatistics', {
      auth: 'admin',
      query: { begin, end },
    });
  },
  ordersReport(begin: string, end: string) {
    return request<OrderReportVO>('/api/admin/report/ordersStatistics', {
      auth: 'admin',
      query: { begin, end },
    });
  },
  top10Report(begin: string, end: string) {
    return request<SalesTop10ReportVO>('/api/admin/report/top10', {
      auth: 'admin',
      query: { begin, end },
    });
  },
  exportReport() {
    return requestBlob('/api/admin/report/export', { auth: 'admin' });
  },
};
