import { FaDeleteLeft } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

export default function NumericKeyboard({ value, onChange, maxLength = 20 }) {
    const { t } = useTranslation();
    const handleKeyClick = (key) => {
        if (key === 'backspace') {
            onChange(value.slice(0, -1));
        } else if (key === 'clear') {
            onChange('');
        } else {
            if (value.length < maxLength) {
                onChange(value + key);
            }
        }
    };

    const keys = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['0', 'backspace'],
    ];

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-2">
                {keys.map((row, rowIndex) => (
                    <div key={rowIndex} className="contents">
                        {row.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleKeyClick(key)}
                                className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                                    key === 'backspace'
                                        ? 'col-span-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center'
                                        : 'bg-white dark:bg-gray-600 hover:bg-blue-50 dark:hover:bg-gray-500 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-500 active:scale-95'
                                }`}
                            >
                                {key === 'backspace' ? <FaDeleteLeft size={18} /> : key}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Clear Button */}
            <button
                type="button"
                onClick={() => handleKeyClick('clear')}
                className="w-full mt-2 py-2.5 px-3 rounded-lg font-semibold text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition-all"
            >
                {t('studentLogin.clearAll')}
            </button>
        </div>
    );
}
