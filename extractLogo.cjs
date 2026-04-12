const fs = require('fs');
const content = fs.readFileSync('reference letterhead.svg', 'utf8');
const match = content.match(/xlink:href="(data:image\/png;base64,[^"]+)"/);
if (match) {
  if (!fs.existsSync('src/assets')) {
    fs.mkdirSync('src/assets', { recursive: true });
  }
  fs.writeFileSync('src/assets/logo.ts', 'export const logoBase64 = `' + match[1] + '`;\n');
  console.log('Successfully extracted logo');
} else {
  console.log('Logo not found');
}
