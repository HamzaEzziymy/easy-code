import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaFileLines, FaImage } from 'react-icons/fa6';

const panel =
    'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

export default function Create() {
    const { t } = useTranslation();

    const types = [
        {
            key: 'text_based',
            icon: <FaFileLines size={32} className="text-[#007BFF] dark:text-[#00AEEF]" />,
            title: t('questions.typeTextTitle'),
            description: t('questions.typeTextDesc'),
            href: route('questions.create.text'),
        },
        {
            key: 'image_based',
            icon: <FaImage size={32} className="text-[#007BFF] dark:text-[#00AEEF]" />,
            title: t('questions.typeImageTitle'),
            description: t('questions.typeImageDesc'),
            href: route('questions.create.image'),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-x-3">
                    <Link
                        href={route('questions.index')}
                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        title={t('questions.back')}
                        aria-label={t('questions.back')}
                    >
                        <FaArrowLeft className="rtl:-scale-x-100" size={14} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            {t('questions.chooseType')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {t('questions.chooseTypeHelp')}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={t('questions.chooseType')} />

            <div className="py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                        {types.map((type) => (
                            <Link
                                key={type.key}
                                href={type.href}
                                className={`${panel} group flex flex-col items-center gap-y-4 p-8 text-center transition-all hover:border-[#007BFF] hover:shadow-md dark:hover:border-[#007BFF]`}
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
                                    {type.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {type.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        {type.description}
                                    </p>
                                </div>
                                <span className="mt-auto inline-flex items-center rounded-xl bg-[#007BFF] px-5 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#0068d6]">
                                    {t('questions.selectType')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
