import { useRef, useEffect } from 'react';

export default function OTPInput({ value, onChange, length = 6, maxLength = 20 }) {
    const inputRefs = useRef([]);

    const handleChange = (index, char) => {
        // Only allow alphanumeric and dash
        if (!/^[A-Za-z0-9\-]?$/.test(char)) return;

        const newValue = value.split('');
        newValue[index] = char.toUpperCase();
        const newFullValue = newValue.join('');

        // Enforce max length
        if (newFullValue.replace(/[^\w\-]/g, '').length > maxLength) return;

        onChange(newFullValue);

        // Auto-focus next input if character entered
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newValue = value.split('');
            newValue[index] = '';
            onChange(newValue.join(''));

            // Focus previous input on backspace if current is empty
            if (!value[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text/plain').toUpperCase().slice(0, maxLength);
        onChange(pastedText);

        // Focus the last field
        const lastIndex = Math.min(pastedText.length - 1, length - 1);
        inputRefs.current[lastIndex]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:focus:border-[#00AEEF] dark:focus:ring-[#00AEEF]/20 outline-none transition-all uppercase"
                    placeholder="-"
                    inputMode="text"
                />
            ))}
        </div>
    );
}
