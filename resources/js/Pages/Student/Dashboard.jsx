import StudentLayout from '@/Layouts/StudentLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaInbox } from 'react-icons/fa';

export default function Dashboard({ student }) {
    const { t } = useTranslation();

    return (
        <StudentLayout student={student}>
            <Head title={t('student.title')} />

            <div className="w-full rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-lg shadow-gray-300/40 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-white shadow-lg shadow-blue-500/30">
                    <FaInbox size={26} />
                </span>
                <p className="mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {student ? t('student.emptyTitle') : t('student.notEnrolled')}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {student ? t('student.emptyHelp') : t('student.notEnrolledHelp')}
                </p>
                <div className="mt-8 flex items-center justify-center gap-x-2">
                    <span className="h-2 w-2 rounded-full bg-[#FFC107]" />
                    <span className="h-2 w-2 rounded-full bg-[#007BFF]" />
                    <span className="h-2 w-2 rounded-full bg-[#00AEEF]" />
                    <span className="h-2 w-2 rounded-full bg-[#FF9800]" />
                </div>
            </div>
        </StudentLayout>
    );
}
