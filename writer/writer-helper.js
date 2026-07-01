/**
 * 虾虾写作助手 - Cron 助手脚本
 * 
 * 在 cron 的 isolated session 中通过 exec 调用，
 * 完成 Supabase 读写操作。
 * 
 * 用法：
 *   node writer-helper.js check-pending                  # 检查并读取pending.json，返回JSON或空
 *   node writer-helper.js query-pending                  # 查询Supabase待处理消息，返回JSON
 *   node writer-helper.js post-message <convId> <content> # 发一条助手消息
 *   node writer-helper.js mark-handled <msgId>            # 标记用户消息已处理
 *   node writer-helper.js update-conv <convId>            # 更新对话时间戳
 *   node writer-helper.js query-history <convId>          # 查对话历史，返回JSON
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWRmZ2l2YXFxcHh0amlseG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjY3NjMsImV4cCI6MjA5NTMwMjc2M30.VUbG7bnXzNeaIfTT5PsSpPIy__IEONbZBHLRen3iDPY';
const BASE_DIR = path.resolve(__dirname);
const PENDING_FILE = path.join(BASE_DIR, 'pending.json');

function supabaseRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, 'https://bxmdfgivaqqpxtjilxnj.supabase.co');
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null, raw: data });
        } catch(e) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === 'check-pending') {
    if (!fs.existsSync(PENDING_FILE)) {
      console.log('EMPTY');
      return;
    }
    const content = fs.readFileSync(PENDING_FILE, 'utf-8').trim();
    if (!content || content === '""' || content === "''") {
      console.log('EMPTY');
      return;
    }
    try {
      const data = JSON.parse(content);
      // 清空文件
      fs.writeFileSync(PENDING_FILE, '', 'utf-8');
      console.log(JSON.stringify(data));
    } catch(e) {
      fs.writeFileSync(PENDING_FILE, '', 'utf-8');
      console.log('EMPTY');
    }
    return;
  }

  if (cmd === 'query-pending') {
    const result = await supabaseRequest('GET',
      '/rest/v1/writer_messages?select=id,conversation_id,content,created_at&role=eq.user&axia_handled=eq.false&order=created_at.asc');
    if (result.status === 200 && Array.isArray(result.body) && result.body.length > 0) {
      console.log(JSON.stringify(result.body));
    } else {
      console.log('EMPTY');
    }
    return;
  }

  if (cmd === 'post-message') {
    const convId = process.argv[3];
    let content = process.argv[4];
    if (!convId || !content) { console.log('ERROR: missing args'); return; }
    // 将 shell 传入的 \n 转成真实换行符
    content = content.replace(/\\n/g, '\n');
    const result = await supabaseRequest('POST', '/rest/v1/writer_messages', {
      conversation_id: parseInt(convId),
      role: 'assistant',
      content: content,
      axia_handled: true
    });
    console.log(result.status === 201 ? 'OK' : 'FAIL:' + result.status);
    return;
  }

  if (cmd === 'mark-handled') {
    const msgId = process.argv[3];
    if (!msgId) { console.log('ERROR: missing msgId'); return; }
    const result = await supabaseRequest('PATCH',
      '/rest/v1/writer_messages?id=eq.' + msgId,
      { axia_handled: true });
    console.log(result.status >= 200 && result.status < 300 ? 'OK' : 'FAIL:' + result.status);
    return;
  }

  if (cmd === 'update-conv') {
    const convId = process.argv[3];
    if (!convId) { console.log('ERROR: missing convId'); return; }
    const result = await supabaseRequest('PATCH',
      '/rest/v1/writer_conversations?id=eq.' + convId,
      { updated_at: new Date().toISOString() });
    console.log(result.status >= 200 && result.status < 300 ? 'OK' : 'FAIL:' + result.status);
    return;
  }

  if (cmd === 'query-history') {
    const convId = process.argv[3];
    if (!convId) { console.log('ERROR: missing convId'); return; }
    const result = await supabaseRequest('GET',
      '/rest/v1/writer_messages?select=role,content&conversation_id=eq.' + convId + '&order=created_at.asc');
    if (result.status === 200 && Array.isArray(result.body)) {
      console.log(JSON.stringify(result.body));
    } else {
      console.log('EMPTY');
    }
    return;
  }

  if (cmd === 'read-file') {
    const fileIdOrName = process.argv[3];
    if (!fileIdOrName) { console.log('ERROR: missing fileId'); return; }
    // 先按 ID 查
    let result = await supabaseRequest('GET',
      '/rest/v1/writer_files?select=id,name,content&id=eq.' + fileIdOrName + '&limit=1');
    // 如果 ID 查不到，按文件名查
    if (!result.body || !result.body.length) {
      result = await supabaseRequest('GET',
        '/rest/v1/writer_files?select=id,name,content&name=eq.' + encodeURIComponent(fileIdOrName) + '&limit=1');
    }
    if (result.status === 200 && result.body && result.body.length > 0) {
      const file = result.body[0];
      console.log(JSON.stringify({ id: file.id, name: file.name, content: file.content }));
    } else {
      console.log('EMPTY');
    }
    return;
  }

  console.log('ERROR: unknown command ' + cmd);
}

main().catch(e => console.log('ERROR:' + e.message));
