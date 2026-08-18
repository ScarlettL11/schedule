# 面试官轮值排班台 - 服务端版本

这个版本不再依赖浏览器本地存储，所有排班数据统一保存在服务器上的 `data/state.json`。

## 启动

```bash
npm start
```

或者：

```bash
node server.js
```

默认地址：`http://localhost:3000`

如果需要修改端口：

```bash
PORT=8080 node server.js
```

## 多人同步方式

- 所有用户打开同一个地址，读到的都是服务器上的同一份数据。
- 每个页面每 4 秒轮询一次服务器；有人保存修改后，其他已打开的页面会自动刷新到最新数据。
- 页面右上角会显示“服务器同步中”或“本地模式”。

## 文件说明

- `server.js`：Node 服务，负责静态页面和 `/api/state` 读写。
- `public/index.html`：单文件前端页面（CSS/JS/数据已内联）。
- `data/state.json`：服务器保存的排班数据，请定期备份。

## 部署建议

可以部署到任何能运行 Node.js 的服务器，例如云服务器、VPS、公司内网服务器。

如果要部署到 Nginx 后面，可以把 Node 服务放在内网端口，再通过 Nginx 反向代理；也可以直接用 `node server.js` 对外提供服务。
