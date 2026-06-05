const fs = require('fs');
const files = ['src/pages/AccountPage.tsx', 'src/pages/AdminDashboard.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/#111827/g, 'var(--text-primary)');
    content = content.replace(/#6b7280/g, 'var(--text-muted)');
    content = content.replace(/#9ca3af/g, 'var(--text-muted)');
    // Add font-display to headings
    content = content.replace(/>Personal Information<\/p>/g, "fontFamily: 'var(--font-display)'}}>Personal Information</p>");
    content = content.replace(/>Delivery Addresses<\/p>/g, "fontFamily: 'var(--font-display)'}}>Delivery Addresses</p>");
    content = content.replace(/>Recent Orders<\/p>/g, "fontFamily: 'var(--font-display)'}}>Recent Orders</p>");
    content = content.replace(/>My Wishlist<\/p>/g, "fontFamily: 'var(--font-display)'}}>My Wishlist</p>");
    content = content.replace(/>Store Overview<\/h2>/g, "fontFamily: 'var(--font-display)'}}>Store Overview</h2>");
    content = content.replace(/>Recent Orders<\/h2>/g, "fontFamily: 'var(--font-display)'}}>Recent Orders</h2>");
    content = content.replace(/>Product Catalog<\/h2>/g, "fontFamily: 'var(--font-display)'}}>Product Catalog</h2>");
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed colors and fonts');
