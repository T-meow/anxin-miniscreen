# 新对话启动提示词

> 复制以下内容，粘贴到新 TRAE 对话中作为开场白

---

## 项目背景

我正在参加 **TRAE AI 创造力大赛**，作品名称是「安心小屏」，属于**社会服务赛道 + 社会公益**方向。

**产品定位**：将闲置旧安卓手机改造成老人桌面陪伴屏，通过大字体、大按钮、语音操作降低使用门槛，实现远程照护和亲情连接。

**目标用户**：独居老人、留守老人、异地照护的子女。

---

## 当前项目状态

项目代码位于：`C:\Users\Ferris\Downloads\TRAE工作区\anxin-xiaoping-demo\`

### 已有功能

| 功能模块 | 说明 | 文件 |
|----------|------|------|
| 老人端界面 | 大按钮布局（问助手/听一会儿/今日提醒/呼叫家人/紧急联系/简单设置） | `src/index.html` + `src/js/elder.js` |
| 子女端界面 | 照护概览、添加提醒表单、提醒状态列表 | `src/index.html` + `src/js/family.js` |
| 提醒系统 | 子女远程添加 → 老人端定时弹窗 → 老人确认 → 状态同步 | `src/js/reminders.js` |
| AI 助手 | 本地响应天气/时间/笑话等，支持语音输入输出 | `src/js/assistant.js` |
| 娱乐陪伴 | 播放预设的故事和音乐列表 | `src/js/entertainment.js` |
| 视频通话 | WebRTC 演示流程（呼叫 → 来电 → 接听 → 通话中 → 挂断） | `src/js/webrtc.js` |
| 隐私保护 | 摄像头/麦克风状态条，通话时红色闪烁提示 | `src/css/main.css` |
| 演示数据 | 首次访问自动加载演示提醒数据 | `src/js/state.js` |
| 演示引导 | 首次使用弹出功能介绍弹窗 | `src/js/app.js` |

### 文件结构

```
anxin-xiaoping-demo/
├── src/
│   ├── index.html          # 单页应用主入口
│   ├── css/
│   │   └── main.css        # 全部样式（老人端/子女端/弹窗/隐私条）
│   ├── js/
│   │   ├── app.js          # 主应用（初始化、模式切换、演示引导）
│   │   ├── state.js        # 状态管理（localStorage + BroadcastChannel）
│   │   ├── elder.js        # 老人端交互逻辑
│   │   ├── family.js       # 子女端交互逻辑
│   │   ├── reminders.js    # 提醒系统（定时检查、弹窗、确认）
│   │   ├── assistant.js    # AI 助手（本地响应 + Web Speech API）
│   │   ├── entertainment.js # 娱乐播放
│   │   └── webrtc.js       # 视频通话流程
│   └── assets/images/      # 产品截图（9张，已准备好）
├── server/
│   ├── index.js            # Express 信令服务器 + AI 代理
│   └── package.json
├── docs/
│   ├── demo-guide.md       # 10步演示流程
│   ├── deploy-guide.md     # 部署指南
│   └── competition-checklist.md  # 比赛材料清单
└── README.md
```

### 技术栈

- 前端：纯 HTML/CSS/JS，单页应用
- 语音：Web Speech API（浏览器本地 ASR/TTS）
- 视频：WebRTC（演示流程，非真实连接）
- 数据：localStorage + BroadcastChannel（同窗口状态同步）
- 服务端：Express（信令 + AI 代理，可选）

---

## 本次对话需要完成的工作

请帮我完成以下任务（按优先级排序）：

### 1. 代码审查与优化（必须）
- 审查现有代码，找出潜在 bug 或可以改进的地方
- 优化移动端适配，确保在旧安卓手机上显示正常
- 检查所有按钮的点击反馈是否足够明显（老人需要明显的视觉反馈）

### 2. 功能增强（建议）
- 添加简单的页面切换动画，让操作更流畅
- 优化提醒弹窗的视觉效果（更大字体、更醒目的颜色）
- 为"紧急联系"功能添加模拟拨打效果（显示正在呼叫的界面）

### 3. 部署准备（建议）
- 确保所有文件路径使用相对路径，方便部署
- 检查是否有遗漏的资源文件
- 优化 index.html 的 meta 标签（PWA 相关）

### 4. 生成 README 更新（可选）
- 更新 README，加入项目截图预览和在线演示链接占位符

---

## 重要约束

1. **不要删除已有功能**，只做优化和增强
2. **保持代码风格一致**（现有代码使用简洁的中文注释）
3. **优先保证老人端的可用性**，所有改动都要考虑适老化
4. **文件路径**：所有操作都在 `C:\Users\Ferris\Downloads\TRAE工作区\anxin-xiaoping-demo\` 目录下
5. **截图资源**：`src/assets/images/` 下有 9 张产品截图，不要删除

---

## 启动指令

请先读取项目的关键文件（`src/index.html`、`src/js/app.js`、`src/css/main.css`），了解当前代码状态，然后按照上面的任务列表开始工作。

如果有任何不确定的地方，先问我确认再做修改。
