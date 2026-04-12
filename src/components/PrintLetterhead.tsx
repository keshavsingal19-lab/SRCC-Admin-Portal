import React from 'react';
import { logoBase64 } from '../assets/logo';

interface PrintLetterheadProps {
  title: string;
  dateStr: string;
}

export function PrintLetterhead({ title, dateStr }: PrintLetterheadProps) {
  return (
    <div className="hidden print:block mb-8">
      {/* Header section matching exact reference letterhead.svg */}
      <div className="flex flex-row items-center justify-between border-b-[3px] border-black pb-4">
        {/* Left Logo */}
        <div className="shrink-0 flex items-center justify-center" style={{ width: '120px' }}>
          <img src={logoBase64} alt="SRCC Logo" className="w-[100px] h-[100px] object-contain" />
        </div>

        {/* Center Text */}
        <div className="flex-1 text-center text-black px-2">
          <div className="text-[22px] font-bold tracking-wide" style={{ fontFamily: '"Nirmala UI", sans-serif', marginBottom: '-2px' }}>
            श्री राम कॉलेज ऑफ़ कॉमर्स
          </div>
          <div className="text-[26px] font-bold uppercase tracking-wider" style={{ fontFamily: '"Book Antiqua", Georgia, serif', marginBottom: '2px' }}>
            Shri Ram College of Commerce
          </div>
          <div className="text-[12px] font-medium leading-tight">
            <div style={{ fontFamily: '"Nirmala UI", sans-serif' }}>
              दिल्ली विश्वविद्यालय, मौरिस नगर, दिल्ली ११०००७
            </div>
            <div style={{ fontFamily: '"Bookman Old Style", Georgia, serif' }}>
              University of Delhi, Maurice Nagar, Delhi 110007
            </div>
          </div>
          <div className="text-[11px] font-semibold flex justify-center gap-3 mt-2" style={{ fontFamily: '"Bookman Old Style", Georgia, serif' }}>
            <span>
                <span style={{ fontFamily: '"Nirmala UI", sans-serif' }}>दूरभाष</span>: 27667905, 27666519
            </span>
            <span className="text-[8px] flex items-center">▪</span>
            <span>
                <span style={{ fontFamily: '"Nirmala UI", sans-serif' }}>वेबसाइट</span> : www.srcc.edu
            </span>
            <span className="text-[8px] flex items-center">▪</span>
            <span>
                <span style={{ fontFamily: '"Nirmala UI", sans-serif' }}>ईमेल</span> : principaloffice@srcc.du.ac.in
            </span>
          </div>
        </div>

        {/* Right empty div to balance the flex layout */}
        <div className="shrink-0" style={{ width: '120px' }}></div>
      </div>

      {/* Subtitle / Date */}
      <div className="flex justify-between items-end mt-8 w-full px-2" style={{ fontFamily: '"Book Antiqua", Georgia, serif' }}>
        <div className="text-[20px] font-bold uppercase tracking-wide">
           {title}
        </div>
        <div className="text-[16px]">
           Date: {dateStr}
        </div>
      </div>
    </div>
  );
}
