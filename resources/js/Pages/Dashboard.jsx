import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {t('dashboard.title')}
                </h2>
            }
        >
            <Head title={t('dashboard.title')} />

            <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
                {/* Watermark */}
                <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
                    <img
                        src="/logo_br.png"
                        alt=""
                        className="w-[60rem] max-w-none shrink-0 opacity-[0.14] dark:opacity-[0.2]"
                    />
                </div>

                <div className="relative py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                            <div className="p-6 text-gray-900 dark:text-gray-100">
                                {t('dashboard.loggedIn')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
