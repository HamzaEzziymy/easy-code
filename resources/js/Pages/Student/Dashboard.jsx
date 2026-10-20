import StudentLayout from '@/Layouts/StudentLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaInbox } from 'react-icons/fa';

export default function Dashboard({ student }) {
    const { t } = useTranslation();

    return (
        <StudentLayout student={student}>
            <Head title={t('student.title')} />

            <div className="w-full rounded-3xl border border-gray-100/80 bg-white/80 p-10 text-center shadow-lg shadow-gray-300/40 backdrop-blur dark:border-gray-700/50 dark:bg-gray-800/70 dark:shadow-black/30">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-white shadow-lg shadow-blue-500/30">
                    <FaInbox size={26} />
                </span>
                <p className="mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {student ? t('student.emptyTitle') : t('student.notEnrolled')}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
