import ApplicationLogo from '@/Components/ApplicationLogo';
import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FaBars, FaCarSide, FaIdBadge, FaPhone, FaRegCalendarCheck, FaSignOutAlt } from 'react-icons/fa';

const statusStyles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
    completed: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30',
    suspended: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
};

function Detail({ icon, label, value }) {
    if (!value) {
        return null;
    }

    return (
        <li className="flex items-center gap-x-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-900/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#007BFF] shadow-sm dark:bg-gray-800 dark:text-[#00AEEF]">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {label}
                </span>
                <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {value}
                </span>
            </span>
        </li>
    );
}

export default function StudentLayout({ student, children }) {
    const { t, i18n } = useTranslation();
    const user = usePage().props.auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const language = i18n.resolvedLanguage || i18n.language || 'en';
    const category = student?.category
        ? `${(language.startsWith('ar') ? student.category.nameAr : student.category.nameFr) ?? ''} (${student.category.code})`.trim()
        : null;
    const enrolledOn = student?.enrollmentDate
        ? new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
              new Date(student.enrollmentDate)
          )
        : null;

    const aside = (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-center border-b border-gray-100 px-5 py-5 dark:border-gray-700/60">
                <ApplicationLogo logo_img="/logo_br.png" className="h-12 w-auto" />
            </div>

            <div className="px-5 pb-5 pt-6 text-center">
                <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-2xl font-semibold text-white shadow-lg shadow-blue-500/25">
                    {user.name.charAt(0).toUpperCase()}
                </span>
                <p className="mt-4 break-words text-base font-semibold text-gray-900 dark:text-gray-100">
                    {user.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t('student.file')}
                </p>
                <span
                    className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        statusStyles[student?.status] ??
                        'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/30'
                    }`}
                >
                    {student ? t(`enums.studentStatus.${student.status}`) : t('student.notEnrolled')}
                </span>
            </div>

            <ul className="space-y-2.5 px-5">
                <Detail
                    icon={<FaIdBadge />}
                    label={t('student.studentNumber')}
                    value={student?.studentNumber}
                />
                <Detail icon={<FaCarSide />} label={t('student.category')} value={category} />
                <Detail icon={<FaPhone />} label={t('student.phone')} value={student?.phone} />
                <Detail
                    icon={<FaRegCalendarCheck />}
                    label={t('student.enrolledOn')}
                    value={enrolledOn}
                />
            </ul>

            <div className="mt-auto p-5">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="flex w-full items-center justify-center gap-x-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                    <FaSignOutAlt className="rtl:-scale-x-100" />
                    {t('common.logOut')}
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/60 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30">
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div
                className={`fixed inset-y-0 start-0 z-50 w-80 transform overflow-y-auto border-e border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-700/50 dark:bg-gray-800 lg:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
                }`}
            >
                {aside}
            </div>

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-4 start-4 z-50 hidden w-80 overflow-y-auto rounded-[2rem] border border-gray-100/80 bg-white/70 shadow-sm backdrop-blur-xl dark:border-gray-700/40 dark:bg-gray-800/60 lg:block">
                {aside}
            </aside>

            <div className="lg:ps-[22.5rem]">
                <button
                    type="button"
                    className="fixed top-6 start-6 z-40 rounded-xl border border-gray-100 bg-white/90 p-2.5 text-gray-600 shadow-sm backdrop-blur transition-colors hover:text-[#007BFF] dark:border-gray-700/50 dark:bg-gray-800/90 dark:text-gray-300 lg:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                    title={t('topbar.openMenu')}
                >
                    <FaBars className="h-5 w-5" />
                </button>

                <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 pt-24 sm:p-8 lg:p-12 lg:pt-8">
                    {/* Watermark */}
                    <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
                        <img
                            src="/logo_br.png"
                            alt=""
                            className="w-[60rem] max-w-none shrink-0 opacity-[0.14] dark:opacity-[0.2]"
                        />
                    </div>

                    <div className="relative w-full max-w-xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
