import ApplicationLogo from '@/Components/ApplicationLogo';
import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { applyLocale } from '@/i18n';
import {
    FaBars,
    FaCarSide,
    FaCircleNotch,
    FaGlobe,
    FaIdBadge,
    FaPhone,
    FaRegCalendarCheck,
    FaSignOutAlt,
} from 'react-icons/fa';

const statusStyles = {
    active:    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30',
    completed: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30',
    suspended: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
};

function Detail({ icon, label, value }) {
    if (!value) return null;
    return (
        <li className="flex items-center gap-x-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#007BFF] dark:text-[#00AEEF]">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        document.documentElement.dir = 'ltr';
        return () => applyLocale(i18n.language);
    }, []);

    const handleLogout = () => {
        if (leaving) return;
        setLeaving(true);
        router.post(route('logout'), {}, { onError: () => setLeaving(false) });
    };

    const language   = i18n.resolvedLanguage || i18n.language || 'en';
    const rtl        = language.startsWith('ar');
    const category   = student?.category
        ? `${(rtl ? student.category.nameAr : student.category.nameFr) ?? ''} (${student.category.code})`.trim()
        : null;
    const enrolledOn = student?.enrollmentDate
        ? new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(student.enrollmentDate))
        : null;
    const examLang   = student?.examLanguage
        ? t(`students.examLang.${student.examLanguage}`)
        : null;

    const aside = (
        <div className="relative flex h-full flex-col overflow-hidden">
            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex select-none items-end justify-center pb-16">
                <img src="/logo_br.png" alt="" className="w-44 shrink-0 opacity-[0.10] dark:opacity-[0.14]" />
            </div>

            {/* Logo */}
            <div className="relative flex items-center justify-center px-5 pb-2 pt-6">
                <ApplicationLogo logo_img="/logo_name_br.png" className="h-10 w-auto" />
            </div>

            {/* Avatar + name + status */}
            <div className="relative px-5 pb-6 pt-4 text-center">
                <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                    {user.name.charAt(0).toUpperCase()}
                </span>
                <p className="mt-3 break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user.name}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {t('student.file')}
                </p>
                <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    statusStyles[student?.status] ?? 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/30'
                }`}>
                    {student ? t(`enums.studentStatus.${student.status}`) : t('student.notEnrolled')}
                </span>
            </div>

            {/* Divider */}
            <div className="relative mx-5 border-t border-gray-100 dark:border-gray-700" />

            {/* Key details */}
            <ul className="relative space-y-4 px-5 py-5">
                <Detail icon={<FaIdBadge />}         label={t('student.studentNumber')} value={student?.studentNumber} />
                <Detail icon={<FaCarSide />}          label={t('student.category')}      value={category} />
                <Detail icon={<FaPhone />}            label={t('student.phone')}         value={student?.phone} />
                <Detail icon={<FaRegCalendarCheck />} label={t('student.enrolledOn')}    value={enrolledOn} />
                <Detail icon={<FaGlobe />}            label={t('student.examLanguage')}  value={examLang} />
            </ul>

            {/* Logout */}
            <div className="relative mt-auto p-5">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={leaving}
                    aria-label={t('common.logOut')}
                    className="group flex w-full items-center gap-x-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 shadow-sm outline-none transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-red-400/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-red-100 group-hover:text-red-600 dark:bg-gray-600 dark:text-gray-400 dark:group-hover:bg-red-500/20 dark:group-hover:text-red-300">
                        {leaving
                            ? <FaCircleNotch className="animate-spin" size={13} />
                            : <FaSignOutAlt size={13} />}
                    </span>
                    <span className="truncate">{t('common.logOut')}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            {/* Page watermark */}
            <div className="pointer-events-none fixed inset-0 z-0 flex select-none items-center justify-center overflow-hidden">
                <img src="/logo_br.png" alt="" className="w-[70rem] max-w-none shrink-0 opacity-[0.13] dark:opacity-[0.18]" />
            </div>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile drawer */}
            <div className={`fixed inset-y-0 start-0 z-50 w-64 transform overflow-y-auto bg-white shadow-[0_0_40px_-8px_rgba(15,23,42,0.25)] transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
                {aside}
            </div>

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-4 start-4 z-50 hidden w-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] lg:block">
                {aside}
            </aside>

            <div className="relative z-10 lg:ps-[18.5rem]">
                {/* Mobile menu button */}
                <button
                    type="button"
                    className="fixed start-6 top-6 z-40 rounded-xl border border-gray-100 bg-white p-2.5 text-gray-600 shadow-sm transition-colors hover:text-[#007BFF] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 lg:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                    title={t('topbar.openMenu')}
                >
                    <FaBars className="h-5 w-5" />
                </button>

                <main className="min-h-screen p-6 pt-20 sm:p-8 lg:p-10 lg:pt-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
