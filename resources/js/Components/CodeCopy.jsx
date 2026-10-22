import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaCopy } from 'react-icons/fa';

export default function CodeCopy({ code, className = '' }) {
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

    return (
        <span
            className={`inline-flex items-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 py-1 pe-1.5 ps-3 dark:border-gray-600 dark:bg-gray-700 ${className}`}
        >
            <span dir="ltr" className="font-mono text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                {code}
            </span>
            <button
                type="button"
                onClick={copy}
                title={t(copied ? 'common.copied' : 'common.copy')}
                aria-label={t(copied ? 'common.copied' : 'common.copy')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-[#007BFF] dark:hover:bg-gray-600 dark:hover:text-[#00AEEF]"
            >
                {copied ? <FaCheck size={11} className="text-emerald-600 dark:text-emerald-400" /> : <FaCopy size={11} />}
            </button>
        </span>
    );
}
