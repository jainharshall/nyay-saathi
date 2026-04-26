import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
      >
        <Languages size={16} className="text-[#0EA5E9]" />
        <span>{language === 'hi' ? 'हिंदी' : 'English'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden z-50">
          <button
            onClick={() => { setLanguage('en'); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${language === 'en' ? 'bg-[#0EA5E9]/5 text-[#0EA5E9]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            English
            {language === 'en' && <Check size={14} />}
          </button>
          <button
            onClick={() => { setLanguage('hi'); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${language === 'hi' ? 'bg-[#0EA5E9]/5 text-[#0EA5E9]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            हिंदी
            {language === 'hi' && <Check size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};
