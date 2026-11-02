import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaUsers, FaUserGraduate, FaListAlt } from 'react-icons/fa';
import { FaCircleQuestion } from 'react-icons/fa6';

export default function Dashboard({ stats }) {
    const { t } = useTranslation();

    const cards = [
        {
            key: 'administrators',
            label: t('users.title'),
            value: stats.administrators,
            icon: FaUsers,
            color: 'blue',
            href: route('users.index'),
        },
        {
            key: 'trainees',
            label: t('students.title'),
            value: stats.trainees,
            icon: FaUserGraduate,
            color: 'indigo',
            href: route('students.index'),
        },
        {
            key: 'categories',
            label: t('categories.title'),
            value: stats.categories,
            icon: FaListAlt,
            color: 'violet',
            href: route('categories.index'),
        },
        {
            key: 'questions',
            label: t('questions.title'),
            value: stats.questions,
            icon: FaCircleQuestion,
            color: 'emerald',
            href: route('questions.index'),
        },
    ];

    const palette = {
        blue:   'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 [--icon:theme(colors.blue.500)] dark:[--icon:theme(colors.blue.400)] [--label:theme(colors.blue.600)] dark:[--label:theme(colors.blue.400)]',
        indigo: 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 [--icon:theme(colors.indigo.500)] dark:[--icon:theme(colors.indigo.400)] [--label:theme(colors.indigo.600)] dark:[--label:theme(colors.indigo.400)]',
        violet: 'border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 [--icon:theme(colors.violet.500)] dark:[--icon:theme(colors.violet.400)] [--label:theme(colors.violet.600)] dark:[--label:theme(colors.violet.400)]',
        emerald:'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 [--icon:theme(colors.emerald.500)] dark:[--icon:theme(colors.emerald.400)] [--label:theme(colors.emerald.600)] dark:[--label:theme(colors.emerald.400)]',
    };

    const iconColor = {
        blue:   'text-blue-500 dark:text-blue-400',
        indigo: 'text-indigo-500 dark:text-indigo-400',
        violet: 'text-violet-500 dark:text-violet-400',
        emerald:'text-emerald-500 dark:text-emerald-400',
    };

    const labelColor = {
        blue:   'text-blue-600 dark:text-blue-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        violet: 'text-violet-600 dark:text-violet-400',
        emerald:'text-emerald-600 dark:text-emerald-400',
    };

    const numColor = {
        blue:   'text-blue-700 dark:text-blue-300',
        indigo: 'text-indigo-700 dark:text-indigo-300',
        violet: 'text-violet-700 dark:text-violet-300',
        emerald:'text-emerald-700 dark:text-emerald-300',
    };

    const borderBg = {
        blue:   'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10',
        indigo: 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10',
        violet: 'border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10',
        emerald:'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {t('dashboard.title')}
                </h2>
            }
        >
            <Head title={t('dashboard.title')} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cards.map(({ key, label, value, icon: Icon, color, href }) => (
                            <Link
                                key={key}
                                href={href}
                                className={`rounded-2xl border p-4 transition-opacity hover:opacity-80 ${borderBg[color]}`}
                            >
                                <p className={`text-3xl font-bold ${numColor[color]}`}>{value}</p>
                                <div className="mt-1 flex items-center gap-x-2">
                                    <Icon size={14} className={iconColor[color]} />
                                    <p className={`text-sm font-medium ${labelColor[color]}`}>{label}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
