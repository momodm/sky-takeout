# Codex Skills 对照清单

## 当前说明

- 本地已安装的新增 skills 已经在 `C:\Users\t7952235\.codex\skills`
- 重启 Codex 后，这些 skills 才会进入当前会话可直接调用的列表
- 之后做项目时，你可以直接在需求里点名 skill，我会优先按对应 skill 的规则执行

## 通用类

### `find-skills`
- 适用场景：不知道该用哪个 skill，或者想继续扩展新能力
- 你可以这样说：
  - `帮我找适合这个项目的 skill`
  - `这个需求有没有现成的 skill 可以用`

## 前端与页面呈现

### `frontend-design`
- 适用场景：官网、落地页、后台页面、组件视觉升级、展示型页面
- 更适合：
  - 页面改版
  - 提升高级感
  - 做更完整的视觉呈现
- 你可以这样说：
  - `用 frontend-design 重做这个首页`
  - `这个后台页面用 frontend-design 优化下视觉`

### `web-design-guidelines`
- 适用场景：网页设计规范、布局优化、视觉结构调整
- 更适合：
  - 页面层级梳理
  - 信息结构优化
  - 样式规范统一
- 你可以这样说：
  - `这个页面按 web-design-guidelines 调整布局`
  - `用 web-design-guidelines 帮我统一这个站点风格`

### `vercel-react-best-practices`
- 适用场景：React、Next.js、组件性能、渲染优化、工程实践
- 更适合：
  - React 组件重构
  - Next.js 页面优化
  - 性能和可维护性改进
- 你可以这样说：
  - `这个 React 页面按 vercel-react-best-practices 优化`
  - `帮我用 vercel-react-best-practices 检查这个 Next.js 项目`

## 视频与动画

### `remotion-best-practices`
- 适用场景：Remotion 视频项目、字幕、音视频处理、动画合成
- 更适合：
  - Remotion 组件结构设计
  - 字幕与时间轴处理
  - FFmpeg 相关视频辅助流程
- 你可以这样说：
  - `这个 Remotion 项目按 remotion-best-practices 来做`
  - `用 remotion-best-practices 优化字幕和动画结构`

## Azure 相关项目

### `azure-ai`
- 适用场景：Azure OpenAI、Azure AI Search、Speech、OCR、文档识别
- 你可以这样说：
  - `这个 Azure OpenAI + Search 项目用 azure-ai 来做`
  - `帮我按 azure-ai 设计检索增强问答`

### `azure-deploy`
- 适用场景：Azure 部署流程、资源发布、环境落地
- 你可以这样说：
  - `这个 Azure 项目按 azure-deploy 部署`

### `azure-storage`
- 适用场景：Blob、存储设计、文件上传下载、数据落盘
- 你可以这样说：
  - `这个文件系统接入 Azure Storage，用 azure-storage`

### `azure-cost-optimization`
- 适用场景：Azure 成本优化、资源降本、容量评估
- 你可以这样说：
  - `帮我用 azure-cost-optimization 看看这套资源怎么降本`

### `azure-diagnostics`
- 适用场景：Azure 故障排查、诊断、运行问题定位
- 你可以这样说：
  - `这个 Azure 服务报错了，用 azure-diagnostics 排查`

### `entra-app-registration`
- 适用场景：Entra 应用注册、身份接入、认证配置
- 你可以这样说：
  - `这个 Azure 应用的登录接入，用 entra-app-registration`

### `appinsights-instrumentation`
- 适用场景：Application Insights 埋点、遥测、监控接入
- 你可以这样说：
  - `帮我给这个 Azure 服务接入监控，用 appinsights-instrumentation`

### `azure-compliance`
- 适用场景：Azure 合规、安全要求、治理检查
- 你可以这样说：
  - `这个 Azure 方案帮我按 azure-compliance 过一遍`

### `azure-rbac`
- 适用场景：角色权限、访问控制、最小权限配置
- 你可以这样说：
  - `这个 Azure 项目的权限设计用 azure-rbac`

### `azure-resource-visualizer`
- 适用场景：Azure 资源关系梳理、架构可视化、资源盘点
- 你可以这样说：
  - `帮我把这套 Azure 资源关系梳理出来，用 azure-resource-visualizer`

### `azure-aigateway`
- 适用场景：Azure AI Gateway、模型访问治理、网关层设计
- 你可以这样说：
  - `这个多模型接入层按 azure-aigateway 设计`

### `azure-prepare`
- 适用场景：Azure 项目前置准备、资源清单、基础搭建
- 你可以这样说：
  - `这个 Azure 项目从准备阶段开始，用 azure-prepare`

## 推荐组合

### React / Next.js 网站
- 推荐：`frontend-design` + `web-design-guidelines` + `vercel-react-best-practices`
- 适合：官网、活动页、SaaS 前台、管理后台

### 纯视觉展示页
- 推荐：`frontend-design` + `web-design-guidelines`
- 适合：品牌页、作品集、营销页、企业官网

### Remotion 视频项目
- 推荐：`remotion-best-practices`
- 如果有 React UI 页面：再加 `frontend-design`

### Azure AI 应用
- 推荐：`azure-ai` + `azure-storage` + `azure-deploy`
- 如果涉及认证：加 `entra-app-registration`
- 如果涉及监控：加 `appinsights-instrumentation`

### Azure 企业级治理项目
- 推荐：`azure-compliance` + `azure-rbac` + `azure-cost-optimization` + `azure-diagnostics`

## 后续使用建议

### 最省事的说法

你以后可以直接这样下指令：

- `这个 React 项目请用 vercel-react-best-practices 和 frontend-design 一起做`
- `这个页面改版请使用 frontend-design 和 web-design-guidelines`
- `这个 Azure OpenAI 项目请使用 azure-ai、azure-storage、azure-deploy`
- `这个 Remotion 视频项目请按 remotion-best-practices 处理`

### 如果你不确定怎么选

直接说：

- `帮我从已安装 skills 里选最适合这个项目的`

我会先匹配最合适的 skill，再开始做具体实现。
