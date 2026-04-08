<template>
  <el-dialog
    title="修改密码"
    :visible.sync="dialogFormVisible"
    width="568px"
    class="pwdCon"
    @close="handlePwdClose()"
  >
    <el-form ref="form" :model="form" label-width="85px" :rules="rules">
      <el-form-item label="原密码：" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码：" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="6 - 20 位密码，支持数字和字母"
        />
      </el-form-item>
      <el-form-item label="确认密码：" prop="affirmPassword">
        <el-input v-model="form.affirmPassword" type="password" placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handlePwdClose()">取消</el-button>
      <el-button type="primary" @click="handleSave()">保存</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Form as ElForm } from 'element-ui'
import { editPassword } from '@/api/users'

@Component({
  name: 'Password',
})
export default class extends Vue {
  @Prop() private dialogFormVisible!: boolean

  private validatePwd = (_rule: any, value: string, callback: Function) => {
    const reg = /^[0-9A-Za-z]{6,20}$/
    if (!value) {
      callback(new Error('请输入密码'))
    } else if (!reg.test(value)) {
      callback(new Error('请输入 6 - 20 位数字或字母组合'))
    } else {
      callback()
    }
  }

  private validatePass2 = (_rule: any, value: string, callback: Function) => {
    if (!value) {
      callback(new Error('请再次输入新密码'))
    } else if (value !== this.form.newPassword) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }

  rules = {
    oldPassword: [{ validator: this.validatePwd, trigger: 'blur' }],
    newPassword: [{ validator: this.validatePwd, trigger: 'blur' }],
    affirmPassword: [{ validator: this.validatePass2, trigger: 'blur' }],
  }

  private form = {} as any

  // 弹层只负责前端校验和提交，不改变原有后端密码接口。
  handleSave() {
    ;(this.$refs.form as ElForm).validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }

      await editPassword({
        oldPassword: this.form.oldPassword,
        newPassword: this.form.newPassword,
      })
      this.$message.success('密码已更新')
      this.$emit('handleclose')
      ;(this.$refs.form as ElForm).resetFields()
    })
  }

  handlePwdClose() {
    ;(this.$refs.form as ElForm).resetFields()
    this.$emit('handleclose')
  }
}
</script>

<style lang="scss">
.navbar {
  .pwdCon {
    .el-dialog__body {
      padding-top: 60px;
      padding: 60px 100px 0;
    }

    .el-input__inner {
      padding: 0 12px;
    }

    .el-form-item {
      margin-bottom: 26px;
    }

    .el-form-item__label {
      text-align: left;
    }

    .el-dialog__footer {
      padding-top: 14px;
    }
  }
}
</style>
