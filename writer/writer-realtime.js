/**
 * 虾虾写作助手 - Supabase 消息监听器
 * 
 * 定期查 Supabase 是否有新消息，有则写触发文件，
 * OpenClaw 的 cron 看到触发文件就来处理。
 * 
 * 无需任何 npm 依赖，纯 Node.js 内置模块。
 * 
 * 启动：node writer-realtime.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWRmZ2l2YXFxcHh0amlseG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjY3NjMsImV4cCI6MjA5NTMwMjc2M30.VUbG7bnXzNeaIfTT5PsSpPIy__IEONbZBHLRen3iDPY';
const PENDING_FILE = path.join(__dirname, 'pending.json');

function checkPending() {
  // ★ 如果 pending.json 已经有内容，说明 cron 还在处理中，不要覆盖
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const existing = fs.readFileSync(PENDING_FILE, 'utf-8').trim();
      if (existing && existing.length > 10) {
        return; // 已有待处理内容，等 cron 消化掉
      }
    }
  } catch(e) {
    // 文件读写失败，忽略
  }

  const options = {
    hostname: 'bxmdfgivaqqpxtjilxnj.supabase.co',
    path: '/rest/v1/writer_messages?select=id,conversation_id,content,created_at&role=eq.user&axia_handled=eq.false&order=created_at.asc&limit=5',
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
          const convIds = [...new Set(data.map(m => m.conversation_id))];
          console.log(`[${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}] 📩 ${data.length} 条新消息 (${convIds.length} 个对话)`);
          fs.writeFileSync(PENDING_FILE, JSON.stringify({
            count: data.length,
            messages: data,
            detectedAt: new Date().toISOString()
          }, null, 2));
        }
      } catch(e) {
        // JSON 解析失败，忽略
      }
    });
  }).on('error', (err) => {
    // 网络错误，下次重试
  });
}

console.log(`[🦐] 虾虾写作助手 - 消息监听器启动 (${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})})`);
console.log('[🦐] 每 10 秒检查一次新消息');

// 立即检查一次
checkPending();

// 每 10 秒检查
setInterval(checkPending, 10000);

process.on('SIGINT', () => {
  console.log('\n[🦐] 监听器退出');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n[🦐] 监听器退出');
  process.exit(0);
});
