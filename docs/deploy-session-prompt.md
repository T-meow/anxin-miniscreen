# 部署专用对话提示词

> 复制以下内容，粘贴到新的 TRAE 对话中作为开场白

---

## 项目背景

我正在参加 **TRAE AI 创造力大赛**，作品名称是「安心小屏」，属于**社会服务赛道 + 社会公益**方向。

**产品定位**：将闲置旧安卓手机改造成老人桌面陪伴屏，通过大字体、大按钮、语音操作降低使用门槛。

**项目代码**：`C:\Users\Ferris\Downloads\TRAE工作区\anxin-xiaoping-demo\`

---

## 本次对话需要完成的工作

### 1. 部署到 GitHub Pages（必须）

请帮我完成以下步骤：

1. 在项目目录下初始化 Git 仓库（如果还没有的话）
2. 创建 `.gitignore` 文件，排除 `node_modules/` 和临时文件
3. 创建一个 GitHub 仓库用的 `README.md`，包含：
   - 项目名称和一句话简介
   - 核心功能列表
   - 在线演示链接占位符（`https://anxin-xiaoping-demo.vercel.app`）
   - 技术栈说明
   - 本地运行方法
4. 提交所有代码并推送（如果已配置 GitHub CLI 的话）

**注意**：这是一个纯前端项目，`src/` 目录下的文件就是全部前端代码。`server/` 目录是可选的信令服务器，可以包含在仓库中但不影响部署。

### 2. 部署到 Vercel（建议）

1. 检查项目是否满足 Vercel 静态部署要求
2. 创建 `vercel.json` 配置文件（如果需要自定义配置）
3. 确认构建配置：
   - Framework Preset: Other
   - Root Directory: `src`（因为 HTML/CSS/JS 都在 src 下）
   - Build Command: 不需要（纯静态）
   - Output Directory: 不需要（纯静态）

### 3. 创建比赛提交的初赛 Demo 帖（必须）

帮我按照 TRAE AI 创造力大赛的官方模板，撰写初赛 Demo 作品帖的内容。帖子将发布在 TRAE 社区【大赛初赛专区】。

**帖子要求**：

标题：`【社会服务赛道】安心小屏 Demo - 旧手机改造老人陪伴助手（附在线体验）`

正文需要包含以下 4 个部分：

**1. Demo 简介**
- 是什么：纯前端 PWA 网页应用，无需安装，浏览器打开即用
- 面向谁：独居老人、留守老人、异地照护的子女
- 主要功能（2-3个）：
  - 提醒系统：子女远程设置 → 老人端到点弹窗 → 老人确认 → 状态同步
  - AI 问助手：本地语音识别 + 文字输入，回答天气/时间/常识问题
  - 视频通话：完整呼叫流程，隐私状态实时可见
- 产品截图位置占位符（我会手动插入 9 张截图）
  - `src/assets/images/01-elder-home.png` 老人端首页
  - `src/assets/images/02-family-overview.png` 子女端概览
  - `src/assets/images/03-assistant-chat.png` AI问助手
  - `src/assets/images/04-entertainment-list.png` 娱乐陪伴
  - `src/assets/images/05-reminders-list.png` 提醒列表
  - `src/assets/images/06-emergency-contact.png` 紧急联系
  - `src/assets/images/07-video-call-incoming.png` 来电界面
  - `src/assets/images/08-video-call-connected.png` 通话中
  - `src/assets/images/09-family-reminder-form.png` 子女端添加提醒

**2. Demo 创作思路**
- 灵感来源：观察到农村留守老人不会用智能手机，子女在外打工无法远程关心
- 想解决的问题：
  - 老人记不住吃药时间，子女无法远程提醒
  - 智能手机操作复杂，老人不敢用
  - 独居老人缺乏陪伴和紧急求助渠道
- 为什么选择这个技术方案：
  - 利用闲置旧手机，零硬件成本
  - PWA 无需安装，打开浏览器就能用
  - 大字体、大按钮、语音播报，真正适老化

**3. Demo 体验地址**
- 占位符：`[部署完成后填入 Vercel 链接]`
- 备选：打包 ZIP 上传 HTML 文件（提示我会手动上传）

**4. TRAE 实践过程**
- 描述开发流程（创意分析 → 技术选型 → 原型开发 → 功能完善 → 部署上线）
- 开发关键步骤截图占位符（我会手动插入 3+ 张 TRAE 对话截图）
- Session ID（我会手动填入）：
  - Session 1: `[当前对话的 Session ID]` —— 部署上线与 Demo 帖撰写
  - Session 2: `[代码优化对话的 Session ID]` —— 代码审查与功能增强
  - Session 3: `[功能开发对话的 Session ID]` —— PWA 原型核心功能开发
- 报名帖链接占位符

### 4. 生成可复制的帖子文本（必须）

把写好的 Demo 帖内容保存为：
- `C:\Users\Ferris\Downloads\TRAE工作区\anxin-xiaoping-demo\docs\demo-post.md`

要求：
- 使用 Markdown 格式，方便直接复制粘贴到 TRAE 社区
- 截图位置用 `![描述](路径)` 标注
- Session ID 和体验链接用 `[待填入]` 标注，我会手动替换

---

## 重要约束

1. **不要修改任何代码文件**，本次对话只做部署和文档工作
2. **不要删除任何文件**，特别是 `src/assets/images/` 下的截图
3. `src/` 是部署目录，Vercel 需要将 `src/` 设为根目录
4. 帖子内容要真实，不要夸大，突出适老化设计和社会价值
5. 帖子语言风格：朴实、清晰，适合社区阅读

---

## 启动指令

请先读取 `C:\Users\Ferris\Downloads\TRAE工作区\anxin-xiaoping-demo\` 的文件结构，了解项目状态，然后按任务列表开始工作。

首先完成 Git 初始化和 GitHub 仓库准备工作，然后撰写 Demo 帖内容。
