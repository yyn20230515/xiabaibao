const fs = require('fs');

function fix(filepath) {
  let c = fs.readFileSync(filepath, 'utf-8');
  
  // Step 1: Add gap to flex container
  c = c.replace(
    '<div style="display:flex;justify-content:space-between;align-items:start">',
    '<div style="display:flex;justify-content:space-between;align-items:start;gap:8px">'
  );
  
  // Step 2: Replace flex:1 with flex:1;min-width:0
  c = c.replace(
    '<div style="flex:1">\n          <div class="meta"',
    '<div style="flex:1;min-width:0">\n          <div class="meta"'
  );
  
  // Step 3: Replace the button line + whitespace before it
  // Find the button line and the closing </div> after it
  const btnStart = c.indexOf('<button onclick="deleteDailyLog(');
  if (btnStart >= 0) {
    const beforeContent = c.lastIndexOf('\n', btnStart - 2);
    const afterContent = c.indexOf('</div>', btnStart);
    const afterClose = c.indexOf('\n', afterContent);
    
    const toRemove = c.substring(beforeContent, afterClose);
    
    // Replace with checkbox in delete mode + closing div
    const replacement = '\n        ${_dailyDeleteMode ? `<input type="checkbox" ${checked} onchange="toggleDailySelect(${item.id})" style="width:18px;height:18px;accent-color:#89d4b6;flex-shrink:0;margin-top:2px">` : \'\'}\n      </div>';
    
    c = c.substring(0, beforeContent) + replacement + c.substring(afterClose);
    console.log(filepath + ': X button replaced with checkbox');
  } else {
    console.log(filepath + ': button not found');
  }
  
  fs.writeFileSync(filepath, c, 'utf-8');
  console.log(filepath + ': SAVED');
}

fix('D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\index.html');
fix('D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\h5\\index.html');
