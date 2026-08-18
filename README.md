# 面试官轮值排班台

## 结构

- `面试官轮值排班台.html`：GitHub Pages 前端页面。
- `server/`：Node.js 后端，负责统一保存数据并提供页面同步。

## GitHub Pages 部署

把 `面试官轮值排班台.html` 作为 GitHub Pages 首页即可。

## 后端部署

把 `server/` 部署到支持 Node.js 的平台（Render / Railway / Fly.io / VPS）。

```bash
cd server
npm start
```

或：

```bash
cd server
node server.js
```

## 多人同步

所有人打开同一个带后端地址的链接：

```text
https://szekalin-1114.github.io/schedule/面试官轮值排班台.html?api=https://你的后端地址
```

页面每 4 秒自动同步一次服务器数据，数据保存在 `server/data/state.json`。
