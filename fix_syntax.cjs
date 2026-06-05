const fs = require('fs');
const files = ['src/pages/AccountPage.tsx', 'src/pages/AdminDashboard.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\}\}fontFamily: 'var\(--font-display\)'\}\}/g, `, fontFamily: 'var(--font-display)' }}`);
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed syntax errors');
