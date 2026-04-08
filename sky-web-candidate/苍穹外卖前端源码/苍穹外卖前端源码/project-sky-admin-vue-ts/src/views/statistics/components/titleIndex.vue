<template>
  <div class="title-index">
    <div class="month">
      <ul class="tabs">
        <li
          v-for="(item, index) in tabsParam"
          :key="index"
          class="li-tab"
          :class="{ active: index === nowIndex }"
          @click="toggleTabs(index)"
        >
          {{ item }}
          <span></span>
        </li>
      </ul>
    </div>
    <div class="get-time">
      <p>已选时间：{{ tateData[0] }} 至 {{ tateData[tateData.length - 1] }}</p>
    </div>
    <el-button icon="iconfont icon-download" class="right-el-button" @click="handleExport">
      导出报表
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { exportInfor } from '@/api/index'

@Component({
  name: 'TitleIndex'
})
export default class extends Vue {
  @Prop() private flag!: any
  @Prop() private tateData!: any
  @Prop() private turnoverData!: any

  nowIndex = 1
  value = []
  tabsParam = ['昨日', '近7日', '近30日', '本周', '本月']

  @Watch('flag')
  private getNowIndex(val) {
    this.nowIndex = val
  }

  private toggleTabs(index: number) {
    this.nowIndex = index
    this.value = []
    this.$emit('sendTitleInd', index + 1)
  }

  private handleExport() {
    this.$confirm('是否确认导出最近 30 天经营数据？', '提示', {
      confirmButtonText: '确认导出',
      cancelButtonText: '暂不导出',
      type: 'warning'
    })
      .then(async function () {
        const { data } = await exportInfor()
        const url = window.URL.createObjectURL(data)
        const anchor = document.createElement('a')
        document.body.appendChild(anchor)
        anchor.href = url
        anchor.download = '经营数据统计报表.xlsx'
        anchor.click()
        window.URL.revokeObjectURL(url)
      })
      .then(() => {})
  }
}
</script>
