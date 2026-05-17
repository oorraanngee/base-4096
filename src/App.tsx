/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { numB10, clrB10, symbols } from './lib/b10';

function getByteSize(str: string, encoding: string): number {
  if (encoding === 'utf8') {
    return new TextEncoder().encode(str).length;
  } else {
    return str.length * 2;
  }
}

function getBinaryDump(str: string, encoding: string): string {
  let binStr = "";
  if (encoding === 'utf8') {
    const bytes = new TextEncoder().encode(str);
    bytes.forEach(b => {
      binStr += b.toString(2).padStart(8, '0') + " ";
    });
  } else {
    for (let i = 0; i < str.length; i++) {
      binStr += str.charCodeAt(i).toString(2).padStart(16, '0') + " ";
    }
  }
  return binStr.trim() || "0";
}

export default function App() {
  const [decimalVal, setDecimalVal] = useState('');
  const [b10NumVal, setB10NumVal] = useState('');
  const [numError, setNumError] = useState(false);

  const [colorHex, setColorHex] = useState('#A855F7');
  const [colorRgb, setColorRgb] = useState('rgb(168, 85, 247)');
  const [colorB10, setColorB10] = useState('');
  
  const [colorHexError, setColorHexError] = useState(false);
  const [colorRgbError, setColorRgbError] = useState(false);
  const [colorB10Error, setColorB10Error] = useState(false);

  const [encoding, setEncoding] = useState('utf8');
  const [unit, setUnit] = useState('bits');

  // Load initial B10 for color
  useEffect(() => {
    setColorB10(clrB10.fromHex('#A855F7'));
  }, []);

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    setDecimalVal(val);
    setNumError(false);

    if (!val) {
      setB10NumVal('');
      return;
    }
    
    try {
      let res = numB10.encode(val);
      if (val.endsWith('.')) res += '.';
      setB10NumVal(res);
    } catch {
      setNumError(true);
    }
  };

  const handleB10NumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/,/g, '.');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    setB10NumVal(val);
    setNumError(false);

    if (!val) {
      setDecimalVal('');
      return;
    }

    try {
      let dec = numB10.decode(val);
      if (dec !== null) {
        if (val.endsWith('.')) dec += '.';
        setDecimalVal(dec);
      } else {
        setNumError(true);
      }
    } catch {
      setNumError(true);
    }
  };

  const applyColor = (hexStr: string, source: 'picker' | 'hex' | 'rgb' | 'b10') => {
    if (source !== 'hex' && source !== 'picker') setColorHex(hexStr);
    
    if (source !== 'rgb') {
      setColorRgb(clrB10.toRgb(clrB10.fromHex(hexStr)));
      setColorRgbError(false);
    }
    if (source !== 'b10') {
      setColorB10(clrB10.fromHex(hexStr));
      setColorB10Error(false);
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setColorHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      applyColor(val.toUpperCase(), 'hex');
      setColorHexError(false);
    } else {
      setColorHexError(true);
    }
  };

  const handleRgbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setColorRgb(val);
    const match = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      let r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
      if (r <= 255 && g <= 255 && b <= 255) {
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        applyColor(hex, 'rgb');
        setColorRgbError(false);
        return;
      }
    }
    setColorRgbError(true);
  };

  const handleB10ColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '');
    setColorB10(val);
    const chars = Array.from(val);
    if (chars.length === 2 && symbols.includes(chars[0] as string) && symbols.includes(chars[1] as string)) {
      const hex = clrB10.toHex(val);
      if (hex !== '#000000' || val.charAt(0) === symbols[0]) {
          applyColor(hex, 'b10');
          setColorB10Error(false);
          return;
      }
    }
    setColorB10Error(true);
  };

  const hBytes = getByteSize(colorHex, encoding);
  const rBytes = getByteSize(colorRgb, encoding);
  const bBytes = getByteSize(colorB10, encoding);

  const hVal = unit === 'bits' ? hBytes * 8 : hBytes;
  const rVal = unit === 'bits' ? rBytes * 8 : rBytes;
  const bVal = unit === 'bits' ? bBytes * 8 : bBytes;
  
  const colorPayload = unit === 'bits' ? 24 : 3;
  const payloadVal = unit === 'bits' ? (Array.from(colorB10).length * 12) : (Array.from(colorB10).length * 1.5);
  const uLabel = unit === 'bits' ? 'бит' : 'байт';

  const binaryText = getBinaryDump(colorB10, encoding);

  const memHexSign = hVal > bVal ? ">" : (hVal < bVal ? "<" : "=");
  const memRgbSign = rVal > bVal ? ">" : (rVal < bVal ? "<" : "=");

  const payHexSign = colorPayload > payloadVal ? ">" : (colorPayload < payloadVal ? "<" : "=");
  const payRgbSign = colorPayload > payloadVal ? ">" : (colorPayload < payloadVal ? "<" : "=");

  return (
    <div className="min-h-screen bg-[#050508] text-[#e2e8f0] font-sans pb-10">
      <header className="pt-10 pb-6 px-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-[#a855f7] drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] text-center mb-2">переводчик B10 (Base-4096)</h1>
        <p className="text-[#64748b] text-center max-w-2xl leading-relaxed">
          Позиционная 4096-ричная система. 1 символ = 12 бит данных.<br />
          Любой RGB цвет (16 миллионов оттенков) записывается ровно <b>двумя</b> символами!
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-10">
        <div className="flex flex-wrap gap-6 w-full justify-center">
          {/* Numbers Card */}
          <div className="bg-[#0f111a] border border-[#2a2d45] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex-1 min-w-[320px] max-w-[480px]">
            <h3 className="text-center text-white text-xl border-b-2 border-[#2a2d45] pb-3 mb-5 font-semibold">Числа и Дроби</h3>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[#94a3b8]">Десятичные (наши числа):</label>
                <input
                  type="text"
                  value={decimalVal}
                  onChange={handleDecimalChange}
                  placeholder="Например: 1024.5"
                  className={`bg-[#161825] border-2 ${numError && decimalVal ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#2a2d45] focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)]'} text-white p-3 text-xl rounded-lg outline-none transition-all tracking-wider`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#94a3b8]">B10 (Base-4096):</label>
                <input
                  type="text"
                  value={b10NumVal}
                  onChange={handleB10NumChange}
                  placeholder="Введите символ B10"
                  className={`bg-[#161825] border-2 ${numError && b10NumVal ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#2a2d45] focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)]'} text-white p-3 text-xl rounded-lg outline-none transition-all tracking-wider`}
                />
              </div>
            </div>
          </div>

          {/* Color Card */}
          <div className="bg-[#0f111a] border border-[#2a2d45] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex-1 min-w-[320px] max-w-[480px]">
            <h3 className="text-center text-white text-xl border-b-2 border-[#2a2d45] pb-3 mb-5 font-semibold">RGB Конвертер Цвета</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[#94a3b8]">Выбери цвет (HEX/RGB):</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-[60px] h-[60px] rounded-lg overflow-hidden border-2 border-[#2a2d45] shrink-0">
                    <input
                      type="color"
                      value={colorHex.length === 7 && !colorHexError ? colorHex : '#000000'}
                      onChange={(e) => {
                        applyColor(e.target.value.toUpperCase(), 'picker');
                        setColorHexError(false);
                      }}
                      className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={colorHex}
                    onChange={handleHexChange}
                    maxLength={7}
                    className={`flex-1 bg-[#161825] border-2 ${colorHexError ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#2a2d45] focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)]'} text-white p-3 text-xl rounded-lg outline-none transition-all tracking-wider uppercase`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#94a3b8]">RGB формат:</label>
                <input
                  type="text"
                  value={colorRgb}
                  onChange={handleRgbChange}
                  className={`bg-[#161825] border-2 ${colorRgbError ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#2a2d45] focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)]'} text-white p-3 text-xl rounded-lg outline-none transition-all tracking-wider`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#94a3b8]">Цвет в B10 (ровно 2 знака):</label>
                <input
                  type="text"
                  value={colorB10}
                  onChange={handleB10ColorChange}
                  placeholder="Двузначный код"
                  className={`bg-[#161825] border-2 ${colorB10Error ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#2a2d45] focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)]'} text-white p-3 text-xl rounded-lg outline-none transition-all tracking-wider`}
                />
              </div>

              <div className="flex flex-col mt-2">
                <div className="flex gap-3 mb-3">
                  <select value={encoding} onChange={(e) => setEncoding(e.target.value)} className="flex-1 bg-[#161825] border-2 border-[#2a2d45] text-white p-2.5 rounded-lg outline-none focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all cursor-pointer">
                    <option value="utf8">Кодировка: UTF-8</option>
                    <option value="utf16">Кодировка: UTF-16</option>
                  </select>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1 bg-[#161825] border-2 border-[#2a2d45] text-white p-2.5 rounded-lg outline-none focus:border-[#a855f7] focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all cursor-pointer">
                    <option value="bytes">В байтах</option>
                    <option value="bits">В битах</option>
                  </select>
                </div>
                
                <div className="bg-[#161825] border-2 border-[#2a2d45] rounded-lg p-4 text-sm text-[#94a3b8]">
                  <div className="flex justify-between mb-1.5 "><span>Текст HEX в памяти:</span> <span className="text-white font-semibold">{hVal} {uLabel}</span></div>
                  <div className="flex justify-between mb-1.5"><span>Текст RGB в памяти:</span> <span className="text-white font-semibold">{rVal} {uLabel}</span></div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-[#2a2d45]">
                    <span>Текст B10 в памяти:</span> <span className="text-yellow-500 font-bold">{bVal} {uLabel}</span>
                  </div>

                  <div className="flex justify-between mt-4">
                    <span className="text-xs text-[#64748b]">Бинарник B10:</span>
                    <div className="font-mono text-[11px] text-sky-400 break-all text-right max-w-[200px] leading-tight flex items-start">
                      {binaryText}
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <span>Ёмкость цвета (Payload):</span> <span className="text-green-500 font-bold">{payloadVal} {uLabel}</span>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-dashed border-[#2a2d45] text-center font-bold text-[#e2e8f0] tracking-wide">
                    <div className="bg-black/20 p-2 rounded-md">
                      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1 font-normal">Текст в памяти</div>
                      HEX {memHexSign} B10 &nbsp;&nbsp;|&nbsp;&nbsp; RGB {memRgbSign} B10
                    </div>
                    <div className="bg-black/20 p-2 rounded-md">
                      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1 font-normal">Ёмкость цвета (Payload)</div>
                      HEX {payHexSign} B10 &nbsp;&nbsp;|&nbsp;&nbsp; RGB {payRgbSign} B10
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="w-full mt-6 max-w-5xl mx-auto">
          <h2 className="text-xl text-[#cbd5e1] mb-6 text-center font-semibold tracking-wide">Установка и использование библиотек</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-[#0f111a] border border-[#2a2d45] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <h3 className="text-center text-white text-lg border-b-2 border-[#2a2d45] pb-3 mb-5 font-semibold">Python (pip)</h3>
              <div className="bg-[#050508] border border-[#2a2d45] rounded-lg p-4 font-mono text-sm flex flex-col gap-2 relative">
                <div className="text-[#64748b] select-none"># Цифры</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">pip install num_b10</code>
                <div className="text-[#64748b] select-none mt-2"># Цвета</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">pip install clr_b10</code>
                <div className="text-[#64748b] select-none mt-2"># Всё вместе</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">pip install full_b10</code>
              </div>
            </div>

            <div className="bg-[#0f111a] border border-[#2a2d45] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <h3 className="text-center text-white text-lg border-b-2 border-[#2a2d45] pb-3 mb-5 font-semibold">Node.js (npm)</h3>
              <div className="bg-[#050508] border border-[#2a2d45] rounded-lg p-4 font-mono text-sm flex flex-col gap-2 relative">
                <div className="text-[#64748b] select-none">// Цифры</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">npm install b10-num</code>
                <div className="text-[#64748b] select-none mt-2">// Цвета</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">npm install b10-clr</code>
                <div className="text-[#64748b] select-none mt-2">// Всё вместе</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">npm install b10-full</code>
              </div>
            </div>

            <div className="bg-[#0f111a] border border-[#2a2d45] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] md:col-span-2">
              <h3 className="text-center text-white text-lg border-b-2 border-[#2a2d45] pb-3 mb-5 font-semibold">Browser (CDN)</h3>
              <div className="bg-[#050508] border border-[#2a2d45] rounded-lg p-4 font-mono text-sm flex flex-col gap-2 relative">
                <div className="text-[#64748b] select-none">&lt;!-- Цифры --&gt;</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">&lt;script src="https://cdn.jsdelivr.net/gh/oorraanngee/b10@main/num-b10.js"&gt;&lt;/script&gt;</code>
                <div className="text-[#64748b] select-none mt-2">&lt;!-- Цвета --&gt;</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">&lt;script src="https://cdn.jsdelivr.net/gh/oorraanngee/b10@main/clr-b10.js"&gt;&lt;/script&gt;</code>
                <div className="text-[#64748b] select-none mt-2">&lt;!-- Всё вместе --&gt;</div>
                <code className="text-[#e2e8f0] bg-[#a855f7]/10 p-2.5 rounded-md border border-[#a855f7]/30 block overflow-x-auto">&lt;script src="https://cdn.jsdelivr.net/gh/oorraanngee/b10@main/b10-full.js"&gt;&lt;/script&gt;</code>
              </div>
            </div>

          </div>
        </section>

        <section className="w-full flex justify-center mt-4">
          <div className="flex flex-wrap gap-5 justify-center">
            <a href="https://github.com/oorraanngee/b10" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center py-3.5 px-7 bg-[#0f111a] border-2 border-[#a855f7] text-white rounded-xl font-semibold text-lg transition-all hover:bg-[#a855f7] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
              📦 Репозиторий библиотек B10
            </a>
            <a href="https://github.com/oorraanngee/base-4096" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center py-3.5 px-7 bg-[#0f111a] border-2 border-[#a855f7] text-white rounded-xl font-semibold text-lg transition-all hover:bg-[#a855f7] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
              🌐 Исходный код сайта B10
            </a>
          </div>
        </section>

        <section className="w-full mt-8">
          <h2 className="text-xl text-[#cbd5e1] mb-6 text-center font-semibold tracking-wide">Словарь (0 — 4095)</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(55px,1fr))] gap-1.5 w-full max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {symbols.map((sym, i) => (
              <div key={i} className="bg-[#0f111a] p-2 rounded-md text-center border border-[#2a2d45] transition-all hover:scale-125 hover:border-[#a855f7] hover:bg-[#161825] hover:z-10 group relative">
                <div className="text-2xl text-[#a855f7] mb-1 leading-none">{sym}</div>
                <div className="text-[10px] text-[#64748b] leading-none">{i}</div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
