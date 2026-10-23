import { useTranslation } from 'react-i18next';

/**
 * The two languages a theory exam exists in. Every exam and question carries a French and an
 * Arabic text, so a file names the one the trainee sits it in.
 */
export const EXAM_LANGUAGES = ['fr', 'ar'];

export default function LanguageChip({ code }) {
    const { t } = useTranslation();

    if (!code) {
        return <span className="text-gray-400">—</span>;
    }

    return (
        <span
            dir={code === 'ar' ? 'rtl' : 'ltr'}
            className="inline-flex rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
            {t(`students.examLang.${code}`)}
        </span>
    );
}
