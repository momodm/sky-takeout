<template>
  <div class="dashboard-container home">
    <Overview :overviewData="overviewData" />
    <Orderview :orderviewData="orderviewData" />
    <div class="homeMain">
      <CuisineStatistics :dishesData="dishesData" />
      <SetMealStatistics :setMealData="setMealData" />
    </div>
    <OrderList
      :order-statics="orderStatics"
      @getOrderListBy3Status="getOrderListBy3Status"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import {
  getBusinessData,
  getOrderData,
  getOverviewDishes,
  getSetMealStatistics
} from '@/api/index'
import { getOrderListBy } from '@/api/order'
import Overview from './components/overview.vue'
import Orderview from './components/orderview.vue'
import CuisineStatistics from './components/cuisineStatistics.vue'
import SetMealStatistics from './components/setMealStatistics.vue'
import OrderList from './components/orderList.vue'

@Component({
  name: 'Dashboard',
  components: {
    Overview,
    Orderview,
    CuisineStatistics,
    SetMealStatistics,
    OrderList
  }
})
export default class extends Vue {
  private overviewData = {}
  private orderviewData = {} as any
  private dishesData = {} as any
  private setMealData = {} as any
  private orderStatics = {} as any

  created() {
    this.init()
  }

  private init() {
    this.$nextTick(() => {
      this.getBusinessOverview()
      this.getOrderOverview()
      this.getDishOverview()
      this.getSetmealOverview()
      this.getOrderListBy3Status()
    })
  }

  private async getBusinessOverview() {
    const response = await getBusinessData()
    const data = response.data.data || {}
    const todayOrders = Number(data.todayOrders || 0)
    const todayTurnover = Number(data.todayTurnover || 0)

    this.overviewData = {
      turnover: todayTurnover.toFixed(2),
      validOrderCount: todayOrders,
      orderCompletionRate: Number(data.todayCompletionRate || 0) / 100,
      unitPrice: todayOrders > 0 ? (todayTurnover / todayOrders).toFixed(2) : '0.00',
      newUsers: Number(data.todayUsers || 0)
    }
  }

  private async getOrderOverview() {
    const response = await getOrderData()
    const data = response.data.data || {}
    this.orderviewData = {
      waitingOrders: Number(data.toBeConfirmedOrders || 0),
      deliveredOrders: Number(data.confirmedOrders || 0),
      completedOrders: Number(data.completedOrders || 0),
      cancelledOrders: Number(data.cancelledOrders || 0),
      allOrders: Number(data.totalOrders || 0)
    }
  }

  private async getDishOverview() {
    const response = await getOverviewDishes()
    const data = response.data.data || {}
    const total = Number(data.dishTotal || 0)
    const enabled = Number(data.dishEnabled || 0)
    this.dishesData = {
      sold: enabled,
      discontinued: Math.max(total - enabled, 0)
    }
  }

  private async getSetmealOverview() {
    const response = await getSetMealStatistics()
    const data = response.data.data || {}
    const total = Number(data.setmealTotal || 0)
    const enabled = Number(data.setmealEnabled || 0)
    this.setMealData = {
      sold: enabled,
      discontinued: Math.max(total - enabled, 0)
    }
  }

  private getOrderListBy3Status() {
    getOrderListBy({})
      .then((response) => {
        if (response.data.code === 1) {
          const data = response.data.data || {}
          this.orderStatics = {
            toBeConfirmed: Number(data.toBeConfirmedOrders || 0),
            confirmed: Number(data.confirmedOrders || 0),
            deliveryInProgress: Number(data.deliveryInProgress || 0)
          }
        } else {
          this.$message.error(response.data.msg || '加载工作台订单状态失败')
        }
      })
      .catch((error) => {
        this.$message.error('加载工作台订单状态失败：' + error.message)
      })
  }
}
</script>

<style lang="scss">
</style>
