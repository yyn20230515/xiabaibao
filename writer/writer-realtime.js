/**
 * 虾虾写作助手 - Supabase Realtime 监听器
 * 
 * 持续监听 writer_messages 表的新消息，
 * 有消息时写触发文件，让 OpenClaw 的轻量 cron 捡起来处理。
 * 
 * 启动：node writer-realtime.js
 * 自动重启保活。
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bxmdfgivaqqpxtjilxnj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWRmZ2l2YXFxcHh0amlseG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjY3NjMsImV4cCI6MjA5NTMwMjc2M30.VUbG7bnXzNeaIfTT5PsSpPIy__IEONbZBHLRen3iDPY';
const PENDING_FILE = path.join(__dirname, 'pending.json');

// ===== Supabase Realtime WebSocket 直连 =====
// 不用 sdk，直接用 WebSocket 连 Supabase Realtime，减少依赖

function connectRealtime() {
  const wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SUPABASE_ANON_KEY + '&vsn=2.0.0';
  
  console.log('[🦐] 连接 Supabase Realtime...');
  
  // 使用 Node.js 的 WebSocket（如果可用）
  let ws;
  try {
    const WebSocket = require('ws');
    ws = new WebSocket(wsUrl);
  } catch (e) {
    console.log('[🦐] ws 模块未安装，尝试内置 fetch + 轮询...');
    // 如果没有 ws 模块，降级为定时 REST 查询
    startPollingFallback();
    return;
  }
  
  let heartbeatTimer = null;
  let reconnectTimer = null;
  
  ws.on('open', () => {
    console.log('[🦐] ✅ Realtime 连接成功！');
    
    // 加入 Realtime 频道，订阅 writer_messages 表的 INSERT
    const joinMsg = {
      topic: 'realtime:writer_messages',
      event: 'phx_join',
      payload: { 
        body: {
          event: 'INSERT',
          schema: 'public',
          table: 'writer_messages',
          filter: `role=eq.user`
        }
      },
      ref: '1'
    };
    ws.send(JSON.stringify(joinMsg));
    
    // 心跳保活
    heartbeatTimer = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: '' }));
      }
    }, 15000);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      // 只处理 writer_messages 的 INSERT 事件
      if (msg.topic === 'realtime:writer_messages' && msg.event === 'INSERT') {
        const newMsg = msg.payload?.record || msg.payload?.data?.record;
        if (newMsg && newMsg.role === 'user' && newMsg.axia_handled === false) {
          console.log('[🦐] 📩 新消息 detected! conv:', newMsg.conversation_id);
          
          // 写触发文件
          const pending = { 
            messageId: newMsg.id, 
            conversationId: newMsg.conversation_id,
            content: newMsg.content,
            detectedAt: new Date().toISOString()
          };
          fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
          console.log('[🦐] ✅ 触发文件已写入');
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  });
  
  ws.on('close', () => {
    console.log('[🦐] ❌ Realtime 断开，5秒后重连...');
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    reconnectTimer = setTimeout(connectRealtime, 5000);
  });
  
  ws.on('error', (err) => {
    console.log('[🦐] ⚠️ Realtime 错误:', err.message);
    ws.close();
  });
}

// ===== 降级方案：定时 REST 查询 =====
function startPollingFallback() {
  console.log('[🦐] 使用 REST 轮询兜底（每 10 秒）');
  
  function checkPending() {
    const options = {
      hostname: 'bxmdfgivaqqpxtjilxnj.supabase.co',
      path: '/rest/v1/writer_messages?select=id,conversation_id,content&role=eq.user&axia_handled=eq.false&order=created_at.asc&limit=1',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    };
    
    https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.length > 0) {
            const msg = data[0];
            console.log('[🦐] 📩 新消息 detected (轮询):', msg.conversation_id);
            fs.writeFileSync(PENDING_FILE, JSON.stringify({
              messageId: msg.id,
              conversationId: msg.conversation_id,
              content: msg.content,
              detectedAt: new Date().toISOString()
            }, null, 2));
          }
        } catch(e) {}
      });
    }).on('error', () => {});
  }
  
  checkPending();
  setInterval(checkPending, 10000);
}

// ===== 启动 =====
console.log(`[🦐] 虾虾写作助手 - Realtime 监听器启动 (${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})})`);
connectRealtime();

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[🦐] 监听器退出');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n[🦐] 监听器退出');
  process.exit(0);
});
