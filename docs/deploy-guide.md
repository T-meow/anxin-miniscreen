# 安心小屏 - 部署指南

## 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **GitHub Pages** | 免费、稳定、与代码仓库一体 | 国内访问可能慢 | ⭐⭐⭐⭐⭐ |
| **Vercel** | 自动部署、全球 CDN、国内访问快 | 需要绑定 Git 仓库 | ⭐⭐⭐⭐⭐ |
| **Netlify** | 拖拽部署、自动 HTTPS、表单处理 | 免费版有流量限制 | ⭐⭐⭐⭐ |
| **Gitee Pages** | 国内访问快 | 需要实名认证、审核 | ⭐⭐⭐ |

## 推荐方案：GitHub Pages + Vercel 双部署

### 为什么选这个方案

1. **GitHub Pages**：代码仓库直接托管，更新方便，适合技术评审查看源码
2. **Vercel**：国内访问速度快，适合比赛现场演示
3. 两者都免费，且支持自定义域名

---

## 方案一：GitHub Pages 部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`anxin-xiaoping`
3. 选择 **Public**（公开）
4. 勾选 **Add a README file**
5. 点击 **Create repository**

### 步骤 2：上传代码

```bash
# 克隆仓库到本地
git clone https://github.com/你的用户名/anxin-xiaoping.git
cd anxin-xiaoping

# 复制项目文件
cp -r /path/to/anxin-xiaoping-demo/src/* .

# 提交代码
git add .
git commit -m "init: 安心小屏比赛Demo"
git push origin main
```

### 步骤 3：启用 GitHub Pages

1. 进入仓库页面
2. 点击 **Settings** → **Pages**
3. **Source** 选择 **Deploy from a branch**
4. **Branch** 选择 **main** / **root**
5. 点击 **Save**
6. 等待 1-2 分钟，访问 `https://你的用户名.github.io/anxin-xiaoping`

### 自定义域名（可选）

1. 在仓库根目录创建 `CNAME` 文件
2. 写入你的域名，如 `anxin.example.com`
3. 在域名服务商添加 CNAME 记录指向 `你的用户名.github.io`

---

## 方案二：Vercel 部署（国内访问快）

### 步骤 1：导入项目

1. 访问 https://vercel.com/new
2. 点击 **Import Git Repository**
3. 授权 GitHub 账号
4. 选择 `anxin-xiaoping` 仓库

### 步骤 2：配置部署

1. **Framework Preset** 选择 **Other**
2. **Root Directory** 留空（使用仓库根目录）
3. 点击 **Deploy**

### 步骤 3：获取域名

- 自动分配 `.vercel.app` 域名，如 `anxin-xiaoping.vercel.app`
- 国内访问速度优于 GitHub Pages

### 自定义域名

1. 进入项目 Dashboard
2. 点击 **Settings** → **Domains**
3. 添加你的域名
4. 按提示配置 DNS 记录

---

## 方案三：Netlify 拖拽部署（最简单）

### 步骤 1：打包项目

```bash
cd anxin-xiaoping-demo/src
zip -r ../../anxin-xiaoping.zip .
```

### 步骤 2：上传部署

1. 访问 https://app.netlify.com/drop
2. 将 `anxin-xiaoping.zip` 拖拽到页面
3. 自动部署完成，获取 `.netlify.app` 域名

---

## 比赛提交材料清单

### 1. 在线演示链接

| 用途 | 链接示例 |
|------|----------|
| 主链接 | `https://anxin-xiaoping.vercel.app` |
| 备用链接 | `https://你的用户名.github.io/anxin-xiaoping` |

### 2. 项目介绍页

建议创建一个 `index.html` 放在仓库根目录，包含：
- 项目简介（200字以内）
- 核心功能截图
- 技术栈说明
- 在线演示入口
- 团队介绍

### 3. 演示视频

- 时长：3-5 分钟
- 内容：完整演示流程（子女端→老人端→提醒→AI→视频）
- 格式：MP4，1080p
- 上传：B站/YouTube/阿里云盘

### 4. 代码仓库

- GitHub 仓库链接
- README.md 包含项目说明
- 代码注释清晰

### 5. 文档

- [开发规划](../anxin-xiaoping-plan/anxin-xiaoping-plan.html)
- [技术架构](../anxin-xiaoping-tech-design/anxin-xiaoping-tech-design.html)
- [演示指南](./demo-guide.md)
- [部署指南](./deploy-guide.md)

---

## 快速检查清单

提交前确认：

- [ ] 在线链接可正常访问
- [ ] 老人端界面显示正常
- [ ] 子女端界面显示正常
- [ ] 提醒功能可正常演示
- [ ] AI 助手可正常对话
- [ ] 视频通话流程完整
- [ ] 移动端适配正常
- [ ] 演示数据已重置
- [ ] 引导弹窗可正常关闭

---

## 常见问题

### Q1: GitHub Pages 访问慢怎么办？
A: 同时使用 Vercel 部署，提交 Vercel 链接作为主链接。

### Q2: 如何更新已部署的项目？
A: 修改代码后 push 到 GitHub，GitHub Pages 和 Vercel 会自动重新部署。

### Q3: 需要后端服务器吗？
A: 当前 Demo 为纯前端，不需要。后续接入真实 AI 和视频通话时需要。

### Q4: 如何隐藏模式切换按钮（比赛时只展示老人端）？
A: 在 `app.js` 中注释掉模式切换相关代码，或添加 `?mode=elder` 参数自动进入老人端。

---

## 联系方式

如有部署问题，请查看：
- GitHub Pages 文档：https://docs.github.com/zh/pages
- Vercel 文档：https://vercel.com/docs
- Netlify 文档：https://docs.netlify.com
