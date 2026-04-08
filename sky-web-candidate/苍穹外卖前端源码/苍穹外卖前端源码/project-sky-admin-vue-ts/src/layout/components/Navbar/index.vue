<template>
  <div class="navbar">
    <div class="statusBox">
      <hamburger
        id="hamburger-container"
        :is-active="sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />
      <span v-if="status === 1" class="businessBtn">营业中</span>
      <span v-else class="businessBtn closing">打烊中</span>
      <span class="socketBadge" :class="{ live: socketReady }">
        {{ socketReady ? '提醒通道在线' : '提醒通道未连接' }}
      </span>
    </div>

    <div class="right-menu">
      <div class="rightStatus">
        <audio ref="audioVo" hidden>
          <source src="./../../../assets/preview.mp3" type="audio/mp3" />
        </audio>
        <audio ref="audioVo2" hidden>
          <source src="./../../../assets/reminder.mp3" type="audio/mp3" />
        </audio>
        <span class="navicon operatingState" @click="handleStatus"><i />营业状态设置</span>
      </div>
      <div class="avatar-wrapper">
        <div
          :class="shopShow ? 'userInfo' : ''"
          @mouseenter="toggleShow"
          @mouseleave="mouseLeaves"
        >
          <el-button type="primary" :class="shopShow ? 'active' : ''">
            {{ name }}<i class="el-icon-arrow-down" />
          </el-button>
          <div v-if="shopShow" class="userList">
            <p class="amendPwdIcon" @click="handlePwd">
              修改密码<i />
            </p>
            <p class="outLogin" @click="logout">
              退出登录<i />
            </p>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="营业状态设置"
      :visible.sync="dialogVisible"
      width="25%"
      :show-close="false"
    >
      <el-radio-group v-model="setStatus">
        <el-radio :label="1">
          营业中
          <span>当前门店会正常接收订单，顾客端可以继续下单。</span>
        </el-radio>
        <el-radio :label="0">
          打烊中
          <span>当前门店暂不接收新的即时订单，适合演示暂停营业场景。</span>
        </el-radio>
      </el-radio-group>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确认</el-button>
      </span>
    </el-dialog>

    <Password :dialog-form-visible="dialogFormVisible" @handleclose="handlePwdClose" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { AppModule } from '@/store/modules/app'
import { UserModule } from '@/store/modules/user'
import Hamburger from '@/components/Hamburger/index.vue'
import { getStatus, setStatus } from '@/api/users'
import Cookies from 'js-cookie'
import Password from '../components/password.vue'

type NoticeKind = 'newOrder' | 'reminder' | 'silent'

@Component({
  name: 'Navbar',
  components: {
    Hamburger,
    Password,
  },
})
export default class extends Vue {
  private websocket: WebSocket | null = null
  private shopShow = false
  private dialogVisible = false
  private status = 1
  private setStatus = 1
  private dialogFormVisible = false
  private socketReady = false

  get sidebar() {
    return AppModule.sidebar
  }

  get name() {
    return (UserModule.userInfo as any).name
      ? (UserModule.userInfo as any).name
      : JSON.parse(Cookies.get('user_info') as any).name
  }

  async mounted() {
    await this.fetchStatus()
    this.initWebSocket()
  }

  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  private toggleSideBar() {
    AppModule.ToggleSideBar(false)
  }

  private async logout() {
    this.$store.dispatch('LogOut').then(() => {
      this.$router.replace({ path: '/login' })
    })
  }

  private async fetchStatus() {
    const { data } = await getStatus()
    this.status = data.data
    this.setStatus = this.status
  }

  private toggleShow() {
    this.shopShow = true
  }

  private mouseLeaves() {
    this.shopShow = false
  }

  private handleStatus() {
    this.dialogVisible = true
  }

  private async handleSave() {
    const { data } = await setStatus(this.setStatus)
    if (data.code === 1) {
      this.dialogVisible = false
      this.$message.success('营业状态已更新')
      this.fetchStatus()
    } else {
      this.$message.error(data.msg || '营业状态更新失败')
    }
  }

  private handlePwd() {
    this.dialogFormVisible = true
  }

  private handlePwdClose() {
    this.dialogFormVisible = false
  }

  // 兼容当前后端的提醒类型，同时接受旧版数字类型做兜底。
  private initWebSocket() {
    const clientId = Math.random().toString(36).substr(2)
    const socketUrl = process.env.VUE_APP_SOCKET_URL + clientId

    if (typeof WebSocket === 'undefined') {
      this.$notify({
        title: '浏览器不支持',
        message: '当前浏览器无法接收实时提醒，请改用 Chrome 或 Edge。',
        type: 'warning',
        duration: 4000,
      })
      return
    }

    this.websocket = new WebSocket(socketUrl)

    this.websocket.onopen = () => {
      this.socketReady = true
      console.log('候选版提醒通道已连接')
    }

    this.websocket.onmessage = (msg: MessageEvent) => {
      const payload = JSON.parse(msg.data || '{}')
      const notice = this.normalizeSocketMessage(payload)
      if (notice.kind === 'silent') {
        return
      }
      this.playNoticeAudio(notice.kind)
      this.$notify({
        title: notice.title,
        message: notice.message,
        type: notice.kind === 'newOrder' ? 'warning' : 'info',
        duration: 5000,
        onClick: () => {
          if (notice.orderId) {
            this.$router.push(`/order?orderId=${notice.orderId}`).catch(() => undefined)
          }
        },
      })
    }

    this.websocket.onerror = () => {
      this.socketReady = false
      this.$notify({
        title: '提醒通道异常',
        message: '当前无法接收实时提醒，但页面其他管理功能仍可继续使用。',
        type: 'warning',
        duration: 4000,
      })
    }

    this.websocket.onclose = () => {
      this.socketReady = false
      console.log('候选版提醒通道已关闭')
    }
  }

  private normalizeSocketMessage(payload: any): {
    kind: NoticeKind
    title: string
    message: string
    orderId?: string | number
  } {
    if (payload.type === 'connection_ready' || payload.type === 'online_count_update') {
      return {
        kind: 'silent',
        title: '',
        message: '',
      }
    }

    if (payload.type === 'new_order' || payload.type === 1) {
      return {
        kind: 'newOrder',
        title: '有新订单待处理',
        message: payload.content || '收到新的订单提醒，请尽快前往订单管理处理。',
        orderId: payload.orderId,
      }
    }

    if (payload.type === 'order_reminder' || payload.type === 2) {
      return {
        kind: 'reminder',
        title: '收到催单提醒',
        message: payload.content || '有顾客发起催单，请及时查看订单状态。',
        orderId: payload.orderId,
      }
    }

    return {
      kind: 'silent',
      title: '',
      message: '',
    }
  }

  private playNoticeAudio(kind: NoticeKind) {
    const audioRef = kind === 'newOrder' ? 'audioVo' : 'audioVo2'
    const player = this.$refs[audioRef] as HTMLAudioElement
    if (player) {
      player.currentTime = 0
      player.play().catch(() => undefined)
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  position: relative;
  background: #ffc100;

  .statusBox {
    float: left;
    height: 100%;
    align-items: center;
    display: flex;
  }

  .hamburger-container {
    padding: 0 12px 0 20px;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .right-menu {
    float: right;
    margin-right: 20px;
    color: #333333;
    font-size: 14px;

    span {
      padding: 0 10px;
      width: 130px;
      display: inline-block;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.52);
      }
    }

    .amendPwdIcon {
      i {
        width: 18px;
        height: 18px;
        background: url(./../../../assets/icons/btn_gaimi@2x.png) no-repeat;
        background-size: contain;
        margin-top: 8px;
      }
    }

    .outLogin {
      i {
        width: 18px;
        height: 18px;
        background: url(./../../../assets/icons/btn_close@2x.png) no-repeat 100% 100%;
        background-size: contain;
        margin-top: 8px;
      }
    }

    &:focus {
      outline: none;
    }
  }

  .rightStatus {
    height: 100%;
    line-height: 60px;
    display: flex;
    align-items: center;
    float: left;
  }

  .avatar-wrapper {
    margin-top: 14px;
    margin-left: 18px;
    position: relative;
    float: right;
    width: 120px;
    text-align: left;

    .el-button--primary {
      background: rgba(255, 255, 255, 0.52);
      border-radius: 4px;
      padding-top: 0px;
      padding-bottom: 0px;
      position: relative;
      width: 120px;
      padding-left: 12px;
      text-align: left;
      border: 0 none;
      height: 32px;
      line-height: 32px;

      &.active {
        background: rgba(250, 250, 250, 0);
        border: 0 none;

        .el-icon-arrow-down {
          transform: rotate(-180deg);
        }
      }
    }
  }

  .businessBtn {
    height: 22px;
    line-height: 20px;
    background: #fd3333;
    border: 1px solid #ffffff;
    border-radius: 4px;
    display: inline-block;
    padding: 0 6px;
    color: #fff;
    width: auto;
  }

  .closing {
    background: #6a6a6a;
  }

  .socketBadge {
    width: auto;
    margin-left: 10px;
    padding: 0 12px;
    height: 26px;
    line-height: 26px;
    border-radius: 13px;
    background: rgba(0, 0, 0, 0.08);
    color: #5f4b00;

    &.live {
      background: rgba(9, 165, 122, 0.16);
      color: #0a7a5b;
    }
  }

  .navicon {
    i {
      display: inline-block;
      width: 18px;
      height: 18px;
      vertical-align: sub;
      margin: 0 4px 0 0;
    }
  }

  .operatingState {
    i {
      background: url('./../../../assets/icons/time.png') no-repeat;
      background-size: contain;
    }
  }
}
</style>

<style lang="scss">
.el-notification {
  width: 419px !important;

  .el-notification__title {
    margin-bottom: 14px;
    color: #333;

    .el-notification__content {
      color: #333;
    }
  }
}

.navbar {
  .el-dialog {
    min-width: auto !important;
  }

  .el-dialog__header {
    height: 61px;
    line-height: 60px;
    background: #fbfbfa;
    padding: 0 30px;
    font-size: 16px;
    color: #333;
    border: 0 none;
  }

  .el-dialog__body {
    padding: 10px 30px 30px;

    .el-radio,
    .el-radio__input {
      white-space: normal;
    }

    .el-radio__label {
      padding-left: 5px;
      color: #333;
      font-weight: 700;

      span {
        display: block;
        line-height: 20px;
        padding-top: 12px;
        color: #666;
        font-weight: normal;
      }
    }

    .el-radio__input.is-checked .el-radio__inner {
      &::after {
        background: #333;
      }
    }

    .el-radio-group {
      & > .is-checked {
        border: 1px solid #ffc200;
      }
    }

    .el-radio {
      width: 100%;
      background: #fbfbfa;
      border: 1px solid #e5e4e4;
      border-radius: 4px;
      padding: 14px 22px;
      margin-top: 20px;
    }
  }

  .el-badge__content.is-fixed {
    top: 24px;
    right: 2px;
    width: 18px;
    height: 18px;
    font-size: 10px;
    line-height: 16px;
    border-radius: 50%;
    padding: 0;
  }

  .badgeW {
    .el-badge__content.is-fixed {
      width: 30px;
      border-radius: 20px;
    }
  }
}

.el-icon-arrow-down {
  background: url('./../../../assets/icons/up.png') no-repeat 50% 50%;
  background-size: contain;
  width: 8px;
  height: 8px;
  transform: rotate(0deg);
  margin-left: 16px;
  position: absolute;
  right: 16px;
  top: 12px;

  &:before {
    content: '';
  }
}

.userInfo {
  background: #fff;
  position: absolute;
  top: 0px;
  left: 0;
  z-index: 99;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.14);
  width: 100%;
  border-radius: 4px;
  line-height: 32px;
  padding: 0 0 5px;
  height: 105px;

  .userList {
    width: 95%;
    padding-left: 5px;
  }

  p {
    cursor: pointer;
    height: 32px;
    line-height: 32px;
    padding: 0 5px 0 7px;

    i {
      margin-left: 10px;
      vertical-align: middle;
      margin-top: 4px;
      float: right;
    }

    &:hover {
      background: #f6f1e1;
    }
  }
}
</style>
