import { useTranslation } from 'react-i18next';

/**
 * The séances as a bar of numbered squares, one square per séance the trainee has to sit:
 * a click fills up to the square hit, and clicking the last filled square takes one back off.
 */
export default function LessonSquares({ value = '', squares = 30, onChange }) {
    const { t } = useTranslation();

    const maximum = Math.max(1, Math.min(99, parseInt(String(squares).replace(/\D/g, ''), 10) || 30));
    const count = Math.max(0, Math.min(maximum, parseInt(String(value).replace(/\D/g, ''), 10) || 0));

    const fill = (target) => onChange(target === count ? String(target - 1) : String(target));

    return (
        <div className="mt-1.5">
            {/* Numbers always read left to right, and the squares stretch to fill each line
                edge to edge instead of leaving ten of them huddled on one side. */}
            <div dir="ltr" className="grid grid-cols-[repeat(auto-fill,minmax(2.6rem,1fr))] gap-1.5">
                {Array.from({ length: maximum }, (_, index) => {
                    const number = index + 1;
                    const filled = number <= count;

                    return (
                        <button
                            key={number}
                            type="button"
                            onClick={() => fill(number)}
                            tabIndex={number === count + 1 ? 0 : -1}
                            title={String(number)}
                            aria-label={String(number)}
                            aria-pressed={filled}
                            className={`h-12 rounded-xl border-2 font-mono text-lg font-semibold outline-none transition ${
                                filled
                                    ? 'border-[#007BFF] bg-[#007BFF] text-white dark:border-[#00AEEF] dark:bg-[#00AEEF]'
                                    : 'border-dashed border-gray-300 bg-white text-gray-300 hover:border-[#007BFF]/60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
                            } ${number === count ? 'ring-2 ring-[#007BFF]/30 dark:ring-[#00AEEF]/30' : ''}`}
                        >
                            {number}
                        </button>
                    );
                })}
            </div>
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                {count > 0
                    ? t('students.lessonsGiven', { total: count, max: maximum })
                    : t('students.lessonsNone')}
            </p>
        </div>
    );
}
