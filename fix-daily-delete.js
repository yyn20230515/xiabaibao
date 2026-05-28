const fs = require('fs');

function updateFile(filepath) {
  let c = fs.readFileSync(filepath, 'utf-8');

  // 1. Update page HTML: add delete button
  c = c.replace(
    '<button class="btn btn-primary btn-sm" onclick="showDailyForm()">\u2795 \u8BB0\u5F55</button>',
    '<button class="btn btn-danger btn-sm" id="dailyDeleteBtn" onclick="toggleDailyDelete()" style="background:#ffe8ec;color:#d4707a;margin-right:6px">\u2796 \u5220\u9664</button><button class="btn btn-primary btn-sm" id="dailyAddBtn" onclick="showDailyForm()">\u2795 \u8BB0\u5F55</button>'
  );

  // 2. Add delete mode functions before tools section
  const toolsIdx = c.indexOf('// ==================== \u5DE5\u5177');
  const deleteFuncs = [
    '',
    'let _dailyDeleteMode = false;',
    'let _dailySelected = new Set();',
    '',
    'function toggleDailyDelete() {',
    '  _dailyDeleteMode = !_dailyDeleteMode;',
    '  _dailySelected.clear();',
    "  const delBtn = document.getElementById('dailyDeleteBtn');",
    "  const addBtn = document.getElementById('dailyAddBtn');",
    '  if (_dailyDeleteMode) {',
    "    delBtn.textContent = '\u2714 \u786E\u8BA4';",
    "    delBtn.style.background = '#ff5252';",
    "    delBtn.style.color = '#fff';",
    "    delBtn.onclick = confirmDailyDelete;",
    "    addBtn.textContent = '\u2716 \u53D6\u6D88';",
    '    addBtn.onclick = toggleDailyDelete;',
    '  } else {',
    "    delBtn.textContent = '\u2796 \u5220\u9664';",
    "    delBtn.style.background = '#ffe8ec';",
    "    delBtn.style.color = '#d4707a';",
    "    addBtn.textContent = '\u2795 \u8BB0\u5F55';",
    '    addBtn.onclick = showDailyForm;',
    '  }',
    '  renderDailyLogs();',
    '}',
    '',
    'function toggleDailySelect(id) {',
    '  if (_dailySelected.has(id)) _dailySelected.delete(id);',
    '  else _dailySelected.add(id);',
    '}',
    '',
    'async function confirmDailyDelete() {',
    '  if (_dailySelected.size === 0) { alert("\u8BF7\u9009\u62E9\u8981\u5220\u9664\u7684\u8BB0\u5F55"); return; }',
    '  if (!confirm("\u786E\u5B9A\u5220\u9664\u9009\u4E2D\u7684 " + _dailySelected.size + " \u6761\u8BB0\u5F55\uFF1F")) return;',
    '  for (const id of _dailySelected) {',
    "    await sb.from('dailylog').delete().eq('id', id);",
    '  }',
    '  _dailyCache = _dailyCache.filter(item => !_dailySelected.has(item.id));',
    '  toggleDailyDelete();',
    '}',
    ''
  ].join('\n');

  c = c.substring(0, toolsIdx) + deleteFuncs + c.substring(toolsIdx);

  // 3. Replace renderDailyLogs
  const oldRender = [
    '  el.innerHTML = _dailyCache.map((item, i) => {',
    "    const isAxia = item.source === 'axia';",
    "    return `<div class=\"item-card\" style=\"border-left:3px solid ${isAxia ? '#b8e1f5' : '#a8e6cf'}\">",
    '      <div style="display:flex;justify-content:space-between;align-items:start">',
    '        <div style="flex:1">',
    '          <div class="meta" style="margin-bottom:4px">',
    "            <span>${item.time || ''}</span>",
    "            <span class=\"tag\" style=\"background:${isAxia ? '#e8f5f0' : '#fef3e2'};color:${isAxia ? '#3d7a5a' : '#b8860b'}\">${isAxia ? '\uD83E\uDD90 \u963F\u590F' : '\uD83D\uDC64 \u6211'}</span>",
    '          </div>',
    '          <p style="font-size:14px;line-height:1.5;white-space:pre-wrap;color:#2d3436">${esc(item.content)}</p>',
    '        </div>',
    '        <button onclick="deleteDailyLog(',
    '      </div>',
    "    </div>`;",
    "  }).join('');"
  ].join('\n');

  const newRender = [
    '  el.innerHTML = _dailyCache.map((item) => {',
    "    const isAxia = item.source === 'axia';",
    "    const checked = _dailySelected.has(item.id) ? 'checked' : '';",
    "    return `<div class=\"item-card\" style=\"border-left:3px solid ${isAxia ? '#b8e1f5' : '#a8e6cf'}\">",
    '      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">',
    '        ${_dailyDeleteMode ? `<input type="checkbox" ${checked} onchange="toggleDailySelect(',
    '        <div style="flex:1;min-width:0">',
    '          <div class="meta" style="margin-bottom:4px">',
    "            <span>${item.time || ''}</span>",
    "            <span class=\"tag\" style=\"background:${isAxia ? '#e8f5f0' : '#fef3e2'};color:${isAxia ? '#3d7a5a' : '#b8860b'}\">${isAxia ? '\uD83E\uDD90 \u963F\u590F' : '\uD83D\uDC64 \u6211'}</span>",
    '          </div>',
    '          <p style="font-size:14px;line-height:1.5;white-space:pre-wrap;color:#2d3436">${esc(item.content)}</p>',
    '        </div>',
    '      </div>',
    "    </div>`;",
    "  }).join('');"
  ].join('\n');

  if (c.includes(oldRender)) {
    c = c.replace(oldRender, newRender);
    console.log('renderDailyLogs updated');
  } else {
    console.log('renderDailyLogs NOT FOUND - checking actual content');
    const s = c.indexOf('el.innerHTML = _dailyCache.map');
    if (s >= 0) console.log('At', s, ':', c.substring(s, s + 300));
  }

  // 4. Remove deleteDailyLog function reference (replace with toggleDailySelect)
  // The old render used ${item.id} in the delete button - the new render doesn't have it

  fs.writeFileSync(filepath, c, 'utf-8');
  console.log('SAVED:', filepath);
}

updateFile('D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\index.html');
updateFile('D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\h5\\index.html');
