const fs = require('fs');
let content = fs.readFileSync('src/components/SvgLetterheadPrint.tsx', 'utf8');

content = content.replaceAll('style=\"white-space: pre\"', 'style={{ whiteSpace: \"pre\" }}');

fs.writeFileSync('src/components/SvgLetterheadPrint.tsx', content);
console.log('Fixed styles');
