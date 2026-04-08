<template>
  <div class="login">
    <div class="login-box">
      <img src="@/assets/login/login-l.png" alt="" />
      <div class="login-form">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules">
          <div class="login-form-title">
            <img src="@/assets/login/icon_logo.png" style="width: 149px; height: 38px" alt="" />
          </div>
          <p class="login-subtitle">后台候选版 · 并行联调入口</p>
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              type="text"
              auto-complete="off"
              placeholder="账号"
              prefix-icon="iconfont icon-user"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="iconfont icon-lock"
              @keyup.enter.native="handleLogin"
            />
          </el-form-item>
          <el-form-item style="width: 100%">
            <el-button
              :loading="loading"
              class="login-btn"
              size="medium"
              type="primary"
              style="width: 100%"
              @click.native.prevent="handleLogin"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Route } from 'vue-router'
import { Form as ElForm } from 'element-ui'
import { UserModule } from '@/store/modules/user'

@Component({
  name: 'Login',
})
export default class extends Vue {
  private validateUsername = (_rule: any, value: string, callback: Function) => {
    if (!value) {
      callback(new Error('请输入用户名'))
    } else {
      callback()
    }
  }

  private validatePassword = (_rule: any, value: string, callback: Function) => {
    if (value.length < 6) {
      callback(new Error('密码至少需要 6 位'))
    } else {
      callback()
    }
  }

  private loginForm = {
    username: 'admin',
    password: '123456',
  } as {
    username: string
    password: string
  }

  loginRules = {
    username: [{ validator: this.validateUsername, trigger: 'blur' }],
    password: [{ validator: this.validatePassword, trigger: 'blur' }],
  }

  private loading = false

  @Watch('$route', { immediate: true })
  private onRouteChange(_route: Route) {}

  // 登录候选后台，并沿用当前后端的 token 鉴权方式。
  private handleLogin() {
    ;(this.$refs.loginForm as ElForm).validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }

      this.loading = true
      await UserModule.Login(this.loginForm as any)
        .then((res: any) => {
          if (String(res.code) === '1') {
            this.$router.push('/')
          } else {
            this.loading = false
          }
        })
        .catch(() => {
          this.loading = false
        })
    })
  }
}
</script>

<style lang="scss">
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #333;
}

.login-box {
  width: 1000px;
  height: 474.38px;
  border-radius: 8px;
  display: flex;

  img {
    width: 60%;
    height: auto;
  }
}

.title {
  margin: 0px auto 10px auto;
  text-align: left;
  color: #707070;
}

.login-form {
  background: #ffffff;
  width: 40%;
  border-radius: 0px 8px 8px 0px;
  display: flex;
  justify-content: center;
  align-items: center;

  .el-form {
    width: 214px;
    height: 307px;
  }

  .el-form-item {
    margin-bottom: 30px;
  }

  .el-form-item.is-error .el-input__inner {
    border: 0 !important;
    border-bottom: 1px solid #fd7065 !important;
    background: #fff !important;
  }

  .input-icon {
    height: 32px;
    width: 18px;
    margin-left: -2px;
  }

  .el-input__inner {
    border: 0;
    border-bottom: 1px solid #e9e9e8;
    border-radius: 0;
    font-size: 12px;
    font-weight: 400;
    color: #333333;
    height: 32px;
    line-height: 32px;
  }

  .el-input__prefix {
    left: 0;
  }

  .el-input--prefix .el-input__inner {
    padding-left: 26px;
  }

  .el-input__inner::placeholder {
    color: #aeb5c4;
  }

  .el-form-item--medium .el-form-item__content {
    line-height: 32px;
  }

  .el-input--medium .el-input__icon {
    line-height: 32px;
  }
}

.login-btn {
  border-radius: 17px;
  padding: 11px 20px !important;
  margin-top: 10px;
  font-size: 12px;
  border: 0;
  font-weight: 500;
  color: #333333;
  background-color: #ffc200;

  &:hover,
  &:focus {
    background-color: #ffc200;
    color: #ffffff;
  }
}

.login-form-title {
  height: 36px;
  display: flex;
  justify-content: center;
}

.login-subtitle {
  margin: 10px 0 24px;
  font-size: 12px;
  color: #8a879d;
  text-align: center;
  letter-spacing: 0.08em;
}
</style>
