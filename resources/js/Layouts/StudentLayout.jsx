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
        <li className="flex items-center gap-x-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#007BFF] dark:text-[#00AEEF]">
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
        <div className="relative flex h-full flex-col overflow-hidden">
            {/* Panel watermark */}
            <div className="pointer-events-none absolute inset-0 flex select-none items-end justify-center pb-16">
                <img
                    src="/logo_br.png"
                    alt=""
                    className="w-56 shrink-0 opacity-[0.12] dark:opacity-[0.16]"
                />
            </div>

            <div className="relative flex items-center justify-center px-5 pb-2 pt-6">
                <ApplicationLogo logo_img="/logo_name_br.png" className="h-10 w-auto" />
            </div>

            <div className="relative px-5 pb-5 pt-4 text-center">
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

            <ul className="relative space-y-4 px-5">
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

            <div className="relative mt-auto p-5">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="flex w-full items-center justify-center gap-x-2 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                    <FaSignOutAlt className="rtl:-scale-x-100" />
                    {t('common.logOut')}
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/60 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30">
            {/* Page watermark */}
            <div className="pointer-events-none fixed inset-0 z-0 flex select-none items-center justify-center overflow-hidden">
                <img
                    src="/logo_br.png"
                    alt=""
                    className="w-[70rem] max-w-none shrink-0 opacity-[0.14] dark:opacity-[0.2]"
                />
            </div>

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div
                className={`fixed inset-y-0 start-0 z-50 w-80 transform overflow-y-auto bg-white shadow-[0_0_40px_-8px_rgba(15,23,42,0.25)] transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
                }`}
            >
                {aside}
            </div>

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-4 start-4 z-50 hidden w-80 overflow-y-auto rounded-3xl border border-gray-100/70 bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)] dark:border-gray-700/40 dark:bg-gray-800 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] lg:block">
                {aside}
            </aside>

            <div className="relative z-10 lg:ps-[22.5rem]">
                <button
                    type="button"
                    className="fixed top-6 start-6 z-40 rounded-xl border border-gray-100 bg-white/90 p-2.5 text-gray-600 shadow-sm backdrop-blur transition-colors hover:text-[#007BFF] dark:border-gray-700/50 dark:bg-gray-800/90 dark:text-gray-300 lg:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                    title={t('topbar.openMenu')}
                >
                    <FaBars className="h-5 w-5" />
                </button>

                <main className="flex min-h-screen items-center justify-center p-6 pt-24 sm:p-8 lg:p-12 lg:pt-8">
                    <div className="w-full max-w-xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
