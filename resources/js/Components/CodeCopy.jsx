import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaCopy } from 'react-icons/fa';

/**
 * The login code, with a button to put it on the clipboard. `large` is the file page's reading
 * size — the code is what the trainee has to type, so staff read it out over the phone.
 */
export default function CodeCopy({ code, large = false, className = '' }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            return;
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    const wrap = large
        ? `inline-flex items-center gap-x-3 ${className}`
        : `inline-flex items-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 py-1 pe-1.5 ps-3 dark:border-gray-600 dark:bg-gray-700 ${className}`;

    const text = large
        ? 'font-mono text-2xl font-bold leading-none tracking-[0.1em] text-[#007BFF] sm:text-3xl dark:text-[#00AEEF]'
        : 'font-mono text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100';

    const button = large
        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#007BFF]/30 bg-white text-[#007BFF] transition-colors hover:bg-[#007BFF] hover:text-white dark:border-[#00AEEF]/40 dark:bg-gray-800 dark:text-[#00AEEF] dark:hover:bg-[#00AEEF] dark:hover:text-white'
        : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-[#007BFF] dark:hover:bg-gray-600 dark:hover:text-[#00AEEF]';

    return (
        <span className={wrap}>
            <span dir="ltr" className={text}>
                {code}
            </span>
            <button
                type="button"
                onClick={copy}
                title={t(copied ? 'common.copied' : 'common.copy')}
                aria-label={t(copied ? 'common.copied' : 'common.copy')}
                className={button}
            >
                {copied ? (
                    <FaCheck size={large ? 15 : 11} className={large ? '' : 'text-emerald-600 dark:text-emerald-400'} />
                ) : (
                    <FaCopy size={large ? 15 : 11} />
                )}
            </button>
        </span>
    );
}
