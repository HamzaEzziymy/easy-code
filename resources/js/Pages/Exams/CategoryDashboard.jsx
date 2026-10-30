import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaClipboardList } from 'react-icons/fa';

export default function CategoryDashboard({ category }) {
    const { i18n } = useTranslation();

    const categoryName = i18n.language === 'ar'
        ? (category.nameAr || category.nameFr || category.code)
        : (category.nameFr || category.nameAr || category.code);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-x-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                        <FaClipboardList size={16} />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                            {categoryName}
                        </h2>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {category.code}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={categoryName} />

            <div className="flex min-h-[60vh] items-center justify-center py-12">
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <FaClipboardList size={36} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Hello from{' '}
                        <span className="text-indigo-600 dark:text-indigo-400">
                            {categoryName}
                        </span>{' '}
                        page
                    </h1>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Category code:{' '}
                        <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            {category.code}
                        </span>
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
