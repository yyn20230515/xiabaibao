const fs = require('fs');
const path = 'D:\\openclaw-home\\.openclaw\\workspace\\xiabaibao\\index.html';
let c = fs.readFileSync(path, 'utf-8');

// Find the daily page HTML section
const pdStart = c.indexOf('id="page-daily"');
const pdEnd = c.indexOf('id="page-note"', pdStart);
const oldDailyHtml = c.substring(pdStart, pdEnd);

console.log('Old daily HTML:');
console.log(oldDailyHtml);
