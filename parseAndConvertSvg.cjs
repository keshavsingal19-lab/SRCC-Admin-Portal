const fs = require('fs');
let svg = fs.readFileSync('reference letterhead.svg', 'utf8');

// Replace XML namespace if present
svg = svg.replace(/xmlns:xml="[^"]+"/g, '');
svg = svg.replace(/xml:space="preserve"/g, '');

// Convert common dashed attributes to camelCase
const dashToCamel = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const attrs = [
  'stroke-width', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight',
  'lengthAdjust', 'textLength', 'preserveAspectRatio', 'clip-path'
];
attrs.forEach(attr => {
  const camel = dashToCamel(attr);
  svg = svg.replaceAll(attr + '=', camel + '=');
});

svg = svg.replaceAll('class=', 'className=');
svg = svg.replaceAll('xlink:href=', 'href=');

// Inside the SVG, we need to locate the table and inject data.
// We can locate the end of the SVG and append a loop for rendering text!

// Find the date space to put dynamic Date
// " Date:  "
svg = svg.replace(/> Date:  </g, '> Date: {dateStr} <');

// Now, we can wrap this in a component.
const template = `import React from 'react';
import { format } from 'date-fns';

export function SvgLetterheadPrint({ records, dateStr }: { records: any[], dateStr: string }) {
  return (
    <div className="hidden print:block w-full h-full" style={{ pageBreakAfter: 'always' }}>
      {/* We scale the SVG to fit the page */}
      <svg
        viewBox="0 0 21590 27940" 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        ${svg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        
        {/* Injecting Rows dynamically based on the SVG grid */}
        {records.map((r, idx) => {
           // First row bottom line is y=8527, top is 7615. text y=8150
           const yLine = 8150 + (idx * 912);
           
           if (yLine > 28000) return null; // Avoid overflowing the page

           return (
             <g key={idx} className="TextShape">
               <text className="SVGTextShape">
                 <tspan className="TextParagraph">
                   <tspan className="TextPosition" x="3884" y={yLine}>
                     <tspan fontFamily="Book Antiqua, serif" fontSize="400px" fontWeight="400" fill="gray">{idx + 1}</tspan>
                   </tspan>
                   <tspan className="TextPosition" x="6000" y={yLine}>
                     <tspan fontFamily="Book Antiqua, serif" fontSize="400px" fontWeight="400" fill="gray">{r.teacher_name}</tspan>
                   </tspan>
                   <tspan className="TextPosition" x="12000" y={yLine}>
                     <tspan fontFamily="Book Antiqua, serif" fontSize="400px" fontWeight="400" fill="gray">{format(new Date(r.start_date), 'MMM d, yyyy')}</tspan>
                   </tspan>
                   <tspan className="TextPosition" x="15000" y={yLine}>
                     <tspan fontFamily="Book Antiqua, serif" fontSize="400px" fontWeight="400" fill="gray">{format(new Date(r.end_date), 'MMM d, yyyy')}</tspan>
                   </tspan>
                 </tspan>
               </text>
             </g>
           );
        })}
      </svg>
    </div>
  );
}
`;

fs.writeFileSync('src/components/SvgLetterheadPrint.tsx', template);
console.log('Component generated!');
