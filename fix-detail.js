const fs = require('fs');
const path = 'D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\index.html';
let content = fs.readFileSync(path, 'utf-8');

// function showCdDetail
const start = content.indexOf('function showCdDetail');
const end = content.indexOf('function ', start + 10);
const oldCd = content.substring(start, end);

const newCd = [
'function showCdDetail(id) {',
'  const idx = findCdIdx(id);',
'  if (idx === -1) { renderCountdowns(); return; }',
'  const item = _cache.countdowns[idx];',
'  const days = getCdDays(item);',
'  const label = getCdLabel(days);',
'  let html = `<div class="card detail-card">',
'      <div class="detail-header">',
'        <button class="detail-back" onclick="renderCountdowns()">\u2190 \u8fd4\u56de</button>',
'        <button class="detail-delete" onclick="if(confirm(\'\u5220\u9664\u6b64\u5012\u8ba1\u65f6\uff1f\')){ deleteCd(${item.id}) }">\uD83D\uDDD1\uFE0F \u5220\u9664</button>',
'      </div>',
'      <div class="detail-title" contenteditable="true" onblur="updateCdField(${item.id},\'title\',this.innerText)">${item.done ? \'\u2705 \' : \'\'}${esc(item.title)}</div>',
'      <div class="detail-meta" style="margin-bottom:10px">',
'        \uD83D\uDCC5 ${item.target_date} ${item.target_time || \'\'}',
'        ${(item.tags||[]).length ? item.tags.map(t => \'<span class="tag">#\' + esc(t) + \'</span>\').join(\'\') : \'\'}',
'      </div>`;',
'  if (!item.done) {',
'    html += `<div style="text-align:center;padding:16px 0">',
'      <span style="font-size:36px;font-weight:700;color:${label.color}">${days < 0 ? \'\u903e\u671f\' + Math.abs(days) + \'\u5929\' : days + \'\u5929\'}</span><br>',
'      <span style="font-size:14px;color:#999">${label.text}</span>',
'    </div>`;',
'  } else {',
'    html += `<div style="text-align:center;padding:16px 0;color:#4caf50;font-size:18px">\uD83C\uDF89 \u5DF2\u5B8C\u6210\uFF01</div>`;',
'  }',
'  if (item.description !== undefined) {',
'    html += `<div class="detail-content" contenteditable="true" onblur="updateCdField(${item.id},\'description\',this.innerText)">${esc(item.description||\'\')}</div>`;',
'  }',
'  html += `</div>`;',
'  if (!item.done) {',
'    html += `<button class="checkin-btn pending" onclick="doCdDone(${item.id})" style="margin:8px 0">\u2705 \u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210</button>`;',
'  } else {',
'    html += `<button class="checkin-btn done" onclick="doCdUndo(${item.id})" style="margin:8px 0">\u21A9\uFE0F \u64A4\u9500\u5B8C\u6210</button>`;',
'  }',
'  document.getElementById(\'countdownList\').innerHTML = html;',
'}',
'',
'async function updateCdField(id, field, value) {',
'  const idx = findCdIdx(id);',
'  if (idx === -1) return;',
'  const update = {};',
'  update[field] = value.trim();',
'  if (update[field] === _cache.countdowns[idx][field]) return;',
'  await sb.from(\'countdowns\').update(update).eq(\'id\', id);',
'  _cache.countdowns[idx][field] = update[field];',
'}'
].join('\n');

content = content.substring(0, start) + newCd + content.substring(end);
fs.writeFileSync(path, content, 'utf-8');
console.log('SUCCESS');
