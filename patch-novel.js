// 🦐 百宝箱小说功能补丁
// 在 index.html 的指定位置插入小说页面的 HTML/CSS/JS

const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, 'index.html');
const H5_FILE = path.join(__dirname, 'h5', 'index.html');

// ====== 要插入的 CSS ======
const NOVEL_CSS = `
/* ===== 小说阅读 ===== */
.novel-card { background:#fff; border-radius:16px; padding:16px; margin-bottom:10px; box-shadow:0 3px 16px rgba(137,212,182,.12); border:1px solid rgba(137,212,182,.12); cursor:pointer; transition:transform .2s; }
.novel-card:active { transform:scale(.97); }
.novel-card h3 { font-size:16px; color:#3d5a5c; margin-bottom:4px; }
.novel-card .sub { font-size:12px; color:#aabfbb; }
.novel-chapter { display:flex; align-items:center; padding:10px 4px; border-bottom:1px solid #f0f5f3; cursor:pointer; }
.novel-chapter:active { background:#f5faf8; }
.novel-chapter .num { color:#89d4b6; font-weight:700; font-size:14px; margin-right:10px; min-width:48px; }
.novel-chapter .title { flex:1; font-size:14px; color:#3d5a5c; }
.novel-chapter .vol { font-size:11px; color:#aabfbb; }
.reader-content { font-size:16px; line-height:2; color:#3d5a5c; padding:16px 0; white-space:pre-wrap; word-wrap:break-word; }
.reader-header { text-align:center; padding:16px 0; border-bottom:1px solid #eef5f2; margin-bottom:16px; }
.reader-header h2 { font-size:18px; color:#3d5a5c; }
.reader-nav { display:flex; gap:8px; margin-top:20px; }
.reader-nav button { flex:1; padding:10px; border:none; border-radius:12px; background:#f0f8f5; color:#3d5a5c; font-size:14px; font-weight:600; cursor:pointer; }
.reader-nav button:active { background:#d4eae3; }
.reader-nav button:disabled { opacity:.3; }
.search-box { width:100%; padding:10px 14px; border:1.5px solid #d4eae3; border-radius:12px; font-size:14px; margin-bottom:12px; background:#f8fcfb; }
.search-box:focus { outline:none; border-color:#89d4b6; }
.novel-empty { text-align:center; padding:40px 16px; color:#aabfbb; font-size:14px; }
`;

// ====== 要插入的 HTML (页面) ======
const NOVEL_PAGE_HTML = `
<!-- ==================== 小说列表页 ==================== -->
<div class="page" id="page-novel">
  <button class="back-btn" onclick="goPage('home')">← 返回主页</button>
  <h2 style="font-size:20px;color:#3d5a5c;margin:8px 0;">📚 小说架</h2>
  <input class="search-box" id="novelSearch" placeholder="🔍 搜索小说..." oninput="filterNovels(this.value)">
  <div id="novelList"></div>
</div>

<!-- ==================== 小说章节页 ==================== -->
<div class="page" id="page-novel-chapters">
  <button class="back-btn" onclick="goPage('novel')">← 返回书库</button>
  <h2 style="font-size:18px;color:#3d5a5c;margin:8px 0;" id="novelChaptersTitle"></h2>
  <div id="chapterList"></div>
</div>

<!-- ==================== 小说阅读页 ==================== -->
<div class="page" id="page-novel-read">
  <button class="back-btn" onclick="goPage('novel-chapters')">← 目录</button>
  <div class="reader-header"><h2 id="readerTitle"></h2></div>
  <div class="reader-content" id="readerContent"></div>
  <div class="reader-nav">
    <button id="readerPrev" onclick="readerPrev()">← 上一章</button>
    <button id="readerNext" onclick="readerNext()">下一章 →</button>
  </div>
</div>
`;

// ====== 要插入的 JS ======
const NOVEL_JS = `
// 📚 小说功能
var _novels = [];
var _novelChapters = [];
var _currentChapterIdx = -1;

async function loadNovels() {
  try {
    const { data } = await sb.from('novels').select('*').order('sort_order');
    _novels = data || [];
    renderNovels();
  } catch(e) { console.error(e); }
}

function renderNovels() {
  var el = document.getElementById('novelList');
  if (!el) return;
  if (!_novels.length) { el.innerHTML = '<div class="novel-empty">📚 还没有小说哦～</div>'; return; }
  el.innerHTML = _novels.map(function(n) {
    return '<div class="novel-card" onclick="openNovel(' + n.id + ')"><h3>' + esc(n.name) + '</h3><div class="sub">' + (n.description ? esc(n.description).slice(0,60) : '') + '</div></div>';
  }).join('');
}

function filterNovels(val) {
  var cards = document.querySelectorAll('#novelList .novel-card');
  cards.forEach(function(c) {
    c.style.display = c.textContent.includes(val) ? '' : 'none';
  });
}

async function openNovel(id) {
  try {
    const { data } = await sb.from('novel_chapters').select('*').eq('novel_id', id).order('sort_order');
    _novelChapters = data || [];
    var novel = _novels.find(function(n) { return n.id === id; });
    document.getElementById('novelChaptersTitle').textContent = '📖 ' + (novel ? esc(novel.name) : '未知');
    renderChapters();
    goPage('novel-chapters');
  } catch(e) { console.error(e); }
}

function renderChapters() {
  var el = document.getElementById('chapterList');
  if (!el) return;
  if (!_novelChapters.length) { el.innerHTML = '<div class="novel-empty">📝 还没有章节～</div>'; return; }
  var html = '';
  var lastVol = '';
  for (var i = 0; i < _novelChapters.length; i++) {
    var ch = _novelChapters[i];
    if (ch.volume_name && ch.volume_name !== lastVol) {
      lastVol = ch.volume_name;
      html += '<div style="font-size:13px;color:#89d4b6;font-weight:700;padding:12px 4px 4px;">📁 ' + esc(ch.volume_name) + '</div>';
    }
    html += '<div class="novel-chapter" onclick="openChapter(' + i + ')"><span class="num">第' + ch.chapter_num + '章</span><span class="title">' + esc(ch.title) + '</span></div>';
  }
  el.innerHTML = html;
}

async function openChapter(idx) {
  _currentChapterIdx = idx;
  var ch = _novelChapters[idx];
  if (!ch) return;
  document.getElementById('readerTitle').textContent = '第' + ch.chapter_num + '章 ' + esc(ch.title);
  document.getElementById('readerContent').textContent = ch.content;
  document.getElementById('readerPrev').disabled = idx <= 0;
  document.getElementById('readerNext').disabled = idx >= _novelChapters.length - 1;
  goPage('novel-read');
}

function readerPrev() {
  if (_currentChapterIdx > 0) openChapter(_currentChapterIdx - 1);
}

function readerNext() {
  if (_currentChapterIdx < _novelChapters.length - 1) openChapter(_currentChapterIdx + 1);
}
`;

// ====== 补丁主函数 ======
function patchIndex(filePath) {
  console.log('📝 修补: ' + filePath);
  let html = fs.readFileSync(filePath, 'utf-8');
  
  // 1. 插入 CSS (在 </style> 前)
  let countCSS = 0;
  html = html.replace('</style>', function(m) { countCSS++; return NOVEL_CSS + '\n' + m; });
  console.log('  ✅ CSS 已插入 (' + countCSS + ' 处)');
  
  // 2. 插入 HTML 页面 (在 </body> 前)
  let countPage = 0;
  html = html.replace('</body>', function(m) { countPage++; return NOVEL_PAGE_HTML + '\n' + m; });
  console.log('  ✅ 页面 HTML 已插入 (' + countPage + ' 处)');
  
  // 3. 在 goPage 的 navMap 中添加 novel
  html = html.replace('navMap = { home: 0, schedule: 1, countdown: 2, farm: 3 }', 'navMap = { home: 0, schedule: 1, countdown: 2, farm: 3, novel: 4 }');
  
  // 4. 在 goPage 末尾添加 novel 路由 (/  前)
  html = html.replace("if (name === 'farm') { loadFarm(); setTimeout(function() { startFarmTimer(); }, 500); }", 
    "if (name === 'farm') { loadFarm(); setTimeout(function() { startFarmTimer(); }, 500); }\n  if (name === 'novel') { loadNovels(); }\n  if (name === 'novel-read') { }");
  
  // 5. 在最后一个 script 块前插入 JS
  html = html.replace('async function loadStudyPlans() {', NOVEL_JS + '\n\nasync function loadStudyPlans() {');
  
  // 6. 添加小说菜单项到菜单数据加载（在 renderMenuItems 里已有循环，只需添加数据库记录）
  // 这个需要用户手动添加 menuitems 记录，或者我们在 loadMenuItems 之后动态添加
  // 先在 updateHome 函数里添加
  html = html.replace('function updateHome() {', 'function updateHome() {\n  // 动态添加小说菜单（如果数据库还没有）\n  var menuGrid = document.getElementById("menuGrid");\n  if (menuGrid && !menuGrid.querySelector(\'[data-page="novel"]\')) {\n    var card = document.createElement("div");\n    card.className = "menu-card";\n    card.setAttribute("data-page", "novel");\n    card.onclick = function(){ goPage("novel"); };\n    card.innerHTML = \'<span class="icon">📖</span><div class="name">小说</div><div class="desc">看阿夏写的书</div>\';\n    menuGrid.appendChild(card);\n  }');
  
  // 7. 添加章节页和阅读页到底部导航 (在 farm 按钮后添加一个新按钮)
  // 跳过底部导航修改，小说主要从主页菜单进入
  
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log('  ✅ 修补完成!');
}

// ====== 执行 ======
if (!fs.existsSync(INDEX_FILE)) {
  console.error('❌ 找不到 index.html');
  process.exit(1);
}

patchIndex(INDEX_FILE);

// 检查 h5 是否存在
if (fs.existsSync(H5_FILE)) {
  console.log('\n📱 h5 版本也会同步修补...');
  patchIndex(H5_FILE);
}

console.log('\n🎉 百宝箱小说功能已添加完成！');
console.log('📌 注意：还需要手动在 Supabase menuitems 表中添加一条记录');
console.log('   或等下次页面加载时自动添加（已写了动态 fallback）');
