// We dynamically evaluate the scripts from the b10-full package
// because they are designed as IIFEs without module exports.
import numB10Src from 'b10-full/num-b10.js?raw';
import clrB10Src from 'b10-full/clr-b10.js?raw';

export const symbols = (function() {
    const arr: string[] = [];
    const ranges = [
        [0x0030, 0x0039], [0x0041, 0x005A], [0x0061, 0x007A], [0x0410, 0x044F],
        [0x1401, 0x1676], [0x16A0, 0x16EA], [0x2200, 0x22FF], [0x2500, 0x257F],
        [0x2800, 0x28FF], [0x2C00, 0x2C2E], [0x2C30, 0x2C5E], [0xA000, 0xA48C],
        [0xAC00, 0xD7A3]
    ];
    for (let r of ranges) {
        for (let i = r[0]; i <= r[1]; i++) {
            arr.push(String.fromCodePoint(i));
            if (arr.length === 4096) return arr;
        }
    }
    return arr;
})();

// Adding symbols to global window object so b10-full files can use them
(window as any).symbols = symbols;

// Extract logic from packages
export const numB10 = new Function(`${numB10Src}\nreturn numB10;`)();
export const clrB10 = new Function(`${clrB10Src}\nreturn clrB10;`)();
