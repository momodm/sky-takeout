import request from '@/utils/request'

// Workspace overview
export const getWorkspaceOverview = () =>
  request({
    url: '/workspace/overview',
    method: 'get'
  })

// Workspace realtime metrics
export const getWorkspaceRealtime = () =>
  request({
    url: '/workspace/realtime',
    method: 'get'
  })

// Workspace order statistics
export const getWorkspaceOrderStatistics = () =>
  request({
    url: '/workspace/orderStatistics',
    method: 'get'
  })

// Keep legacy method names so the old views can be adapted with minimal changes.
export const getOrderData = () => getWorkspaceOrderStatistics()
export const getOverviewDishes = () => getWorkspaceOverview()
export const getSetMealStatistics = () => getWorkspaceOverview()
export const getBusinessData = () => getWorkspaceRealtime()
export const getDataOverView = () => getWorkspaceOverview()

// Report endpoints already supported by the current backend
export const getTurnoverStatistics = (params: any) =>
  request({
    url: '/report/turnoverStatistics',
    method: 'get',
    params
  })

export const getUserStatistics = (params: any) =>
  request({
    url: '/report/userStatistics',
    method: 'get',
    params
  })

export const getOrderStatistics = (params: any) =>
  request({
    url: '/report/ordersStatistics',
    method: 'get',
    params
  })

export const getTop = (params: any) =>
  request({
    url: '/report/top10',
    method: 'get',
    params
  })

export function exportInfor() {
  return request({
    url: '/report/export',
    method: 'get',
    responseType: 'blob'
  })
}
