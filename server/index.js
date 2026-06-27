/**
 * 安心小屏 - 服务端
 * WebSocket 信令服务器 + AI 代理 + 静态文件服务
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（前端 PWA）
app.use(express.static(path.join(__dirname, '../src')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI 聊天代理
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;

  try {
    // 这里可以接入真实的大模型 API
    // 演示模式返回模拟响应
    const responses = {
      '天气': '今天多云，21℃，适合散步。明天可能有小雨，出门记得带伞。',
      '血压': '血压问题请咨询医生。记得按时吃药，保持心情愉快。',
      '家人': '家人很关心你。你可以点击"呼叫家人"和他们视频通话。',
      '故事': '你可以点击"听一会儿"按钮，我会给你讲故事或放音乐。'
    };

    let reply = '这个问题我记下了，你可以让家人帮你查一下，或者点击"呼叫家人"视频聊聊。';
    for (const [key, value] of Object.entries(responses)) {
      if (message.includes(key)) {
        reply = value;
        break;
      }
    }

    res.json({ reply });
  } catch (error) {
    console.error('AI API 错误:', error);
    res.status(500).json({ error: 'AI 服务暂时不可用' });
  }
});

// WebSocket 信令服务器
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('WebSocket 连接建立');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleSignal(ws, data);
    } catch (error) {
      console.error('消息解析错误:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket 连接关闭');
    // 清理客户端
    for (const [id, client] of clients) {
      if (client === ws) {
        clients.delete(id);
        break;
      }
    }
  });
});

// 处理信令
function handleSignal(ws, data) {
  const { type, from, to, payload } = data;

  switch (type) {
    case 'register':
      // 注册客户端
      clients.set(from, ws);
      ws.send(JSON.stringify({ type: 'registered', id: from }));
      console.log(`客户端注册: ${from}`);
      break;

    case 'offer':
    case 'answer':
    case 'ice':
      // 转发信令
      const targetClient = clients.get(to);
      if (targetClient && targetClient.readyState === WebSocket.OPEN) {
        targetClient.send(JSON.stringify({ type, from, payload }));
      }
      break;

    case 'call':
      // 呼叫请求
      const callee = clients.get(to);
      if (callee && callee.readyState === WebSocket.OPEN) {
        callee.send(JSON.stringify({ type: 'incoming', from }));
      }
      break;

    case 'reject':
      // 拒绝通话
      const caller = clients.get(to);
      if (caller && caller.readyState === WebSocket.OPEN) {
        caller.send(JSON.stringify({ type: 'rejected', from }));
      }
      break;

    default:
      console.log('未知信令类型:', type);
  }
}

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`安心小屏服务器运行在端口 ${PORT}`);
  console.log(`前端地址: http://localhost:${PORT}`);
});
