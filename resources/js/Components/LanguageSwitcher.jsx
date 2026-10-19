import Dropdown from '@/Components/Dropdown';
import { locales } from '@/i18n';
import { FaLanguage } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '' }) {
    const { t, i18n } = useTranslation();
    const current = i18n.resolvedLanguage;

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    aria-label={t('language.switcher')}
                    title={t('language.switcher')}
                    className={
                        'flex items-center gap-x-1.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 ' +
                        className
                    }
                >
                    <FaLanguage className="h-5 w-5 shrink-0" />
                    <span className="hidden sm:inline">
                        {locales.find((locale) => locale.code === current)?.label}
                    </span>
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content>
                {locales.map((locale) => (
                    <button
                        key={locale.code}
                        type="button"
                        onClick={() => i18n.changeLanguage(locale.code)}
                        className="flex w-full items-center justify-between px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    >
                        <span>{locale.label}</span>
                        {locale.code === current && (
                            <svg
                                className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        )}
                    </button>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}
