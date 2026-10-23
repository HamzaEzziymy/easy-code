import { toLatinDigits } from '@/Support/digits';
import { useRef } from 'react';

/**
 * A short number typed one digit per square. The row always reads left to right, an Arabic
 * keyboard's ١٢ is folded to 12, and no square sits empty behind a filled one: a digit takes
 * its own square when that square is already used, otherwise the next free square.
 */
export default function DigitSquares({ value = '', onChange, squares = 2, idPrefix = 'digit', label = '' }) {
    const boxes = useRef([]);

    const digits = toLatinDigits(value)
        .replace(/\D/g, '')
        .slice(0, squares)
        .split('');

    const write = (next) => onChange(next.join('').replace(/^0+(?=.)/, ''));

    const focus = (index) => boxes.current[Math.max(0, Math.min(squares - 1, index))]?.focus();

    const type = (index, event) => {
        const typed = toLatinDigits(event.target.value).replace(/\D/g, '').slice(-1);

        if (typed === '') {
            erase(index);

            return;
        }

        const next = [...digits];
        const target = Math.min(index, next.length);
        next[target] = typed;
        write(next);
        focus(target + 1);
    };

    const paste = (event) => {
        event.preventDefault();

        const pasted = toLatinDigits(event.clipboardData.getData('text'))
            .replace(/\D/g, '')
            .slice(0, squares);

        if (pasted === '') {
            return;
        }

        write(pasted.split(''));
        focus(pasted.length);
    };

    const erase = (index) => {
        const target = index < digits.length ? index : digits.length - 1;

        if (target < 0) {
            return;
        }

        write(digits.filter((_, position) => position !== target));
        focus(target);
    };

    return (
        <div dir="ltr" className="flex w-fit gap-1.5">
            {Array.from({ length: squares }, (_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        boxes.current[index] = el;
                    }}
                    id={`${idPrefix}-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={1}
                    aria-label={`${label} ${index + 1}`}
                    value={digits[index] ?? ''}
                    onChange={(event) => type(index, event)}
                    onPaste={paste}
                    onKeyDown={(event) => {
                        if (event.key === 'Backspace' || event.key === 'Delete') {
                            event.preventDefault();
                            erase(index);
                        }
                        if (event.key === 'ArrowLeft') {
                            event.preventDefault();
                            focus(index - 1);
                        }
                        if (event.key === 'ArrowRight') {
                            event.preventDefault();
                            focus(index + 1);
                        }
                    }}
                    className={`h-12 w-11 rounded-xl border-2 text-center font-mono text-lg font-semibold outline-none transition ${
                        digits[index] !== undefined
                            ? 'border-[#007BFF] bg-[#007BFF] text-white dark:border-[#00AEEF] dark:bg-[#00AEEF]'
                            : 'border-dashed border-gray-300 bg-white hover:border-[#007BFF]/60 focus:border-[#007BFF] focus:bg-[#007BFF]/5 focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-[#00AEEF]/60 dark:focus:border-[#00AEEF] dark:focus:bg-[#00AEEF]/10 dark:focus:ring-[#00AEEF]/20'
                    }`}
                />
            ))}
        </div>
    );
}
