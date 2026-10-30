import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    FaHome, FaLayerGroup,
    FaQuestion, FaUser, FaUsers, FaUserGraduate,
    FaChevronDown, FaChevronUp, FaClipboardList,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

/** Return the first `n` words of a string */
function firstWords(str, n = 2) {
    if (!str) return '';
    return str.trim().split(/\s+/).slice(0, n).join(' ');
}

const GROUPS_STORAGE_KEY = 'sidebarOpenGroups';

function Sidebar({ sidebarOpen, setSidebarOpen, mobileMenuOpen, setMobileMenuOpen }) {
    const { t, i18n } = useTranslation();
    const { categories = [] } = usePage().props;

    // ── Detect if we're currently inside an exams.category page ──────
    const isOnExamsCategory = route().current('exams.category');

    // ── Restore open-groups from localStorage; auto-open if on a child page ─
    const [openGroups, setOpenGroups] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) || '{}');
            // If currently on an exams.category page, force the group open
            if (isOnExamsCategory) saved['exams-courses'] = true;
            return saved;
        } catch {
            return isOnExamsCategory ? { 'exams-courses': true } : {};
        }
    });

    const [hovered, setHovered] = useState(false);

    // Visually expanded = pinned open OR hovered
    const expanded = sidebarOpen || hovered;

    const toggleGroup = (key) => {
        setOpenGroups(prev => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    // If navigation lands on an exams.category page, ensure the group stays open
    useEffect(() => {
        if (isOnExamsCategory) {
            setOpenGroups(prev => {
                if (prev['exams-courses']) return prev; // already open, no change
                const next = { ...prev, 'exams-courses': true };
                localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
                return next;
            });
        }
    }, [isOnExamsCategory]);

    /**
     * Pin the sidebar open and persist to localStorage.
     * Called on every meaningful click inside the sidebar.
     */
    const pinOpen = () => {
        if (!sidebarOpen) {
            setSidebarOpen(true);
            setHovered(false);
        }
    };

    // Translated category name, first 2 words
    const getCategoryShortLabel = (cat) => {
        const name = i18n.language === 'ar' ? cat.name_ar : cat.name_fr;
        return firstWords(name || cat.code, 2);
    };

    const categoryChildren = categories.map((cat) => ({
        key:       `cat-${cat.id}`,
        code:      cat.code,
        shortName: getCategoryShortLabel(cat),
        href:      route('exams.category', cat.id),
        current:   route().current('exams.category', { category: cat.id }),
    }));
    console.log(categories)

    // True when any category sub-item is the active page
    const examGroupActive = categoryChildren.some(c => c.current);
    const navigation = [
        {
            key:     'dashboard',
            label:   t('common.dashboard'),
            icon:    <FaHome size={20} />,
            href:    route('dashboard'),
            current: route().current('dashboard'),
        },
        {
            key:     'users',
            label:   t('nav.users'),
            icon:    <FaUsers size={20} />,
            href:    route('users.index'),
            current: route().current('users.*'),
        },
        {
            key:     'students',
            label:   t('nav.students'),
            icon:    <FaUserGraduate size={20} />,
            href:    route('students.index'),
            current: route().current('students.*'),
        },
        {
            key:     'categories',
            label:   t('nav.categories'),
            icon:    <FaLayerGroup size={20} />,
            href:    route('categories.index'),
            current: route().current('categories.*'),
        },
        {
            key:     'questions',
            label:   t('nav.questions'),
            icon:    <FaQuestion size={20} />,
            href:    route('questions.index'),
            current: route().current('questions.*'),
        },
        {
            key:      'exams-courses',
            label:    t('nav.examsAndCourses'),
            icon:     <FaClipboardList size={20} />,
            children: categoryChildren,
            active:   examGroupActive,
        },
        {
            key:     'profile',
            label:   t('nav.profile'),
            icon:    <FaUser size={20} />,
            href:    route('profile.edit'),
            current: route().current('profile.edit'),
        },
    ];

    /* ─────────────────────────────────────────────────────────────────
       Category sub-item row:  [CODE badge]  [First 2 words]
    ───────────────────────────────────────────────────────────────── */
    const CategorySubItem = ({ child }) => (
        <Link
            href={child.href}
            onClick={pinOpen}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
                child.current
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
        >

            {/* ② Code badge */}
            <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {child.code}
            </span>

            {/* ③ First 2 words of name */}
            <span className="truncate text-xs font-medium">{child.shortName}</span>
        </Link>
    );

    /* ─────────────────────────────────────────────────────────────────
       Shared nav list — used by both mobile and desktop
    ───────────────────────────────────────────────────────────────── */
    const renderNav = (isExpanded) => navigation.map((item) =>
        item.children ? (
            <li key={item.key}>
                {/* Group toggle button */}
                <button
                    onClick={() => {
                        pinOpen();
                        if (isExpanded) toggleGroup(item.key);
                    }}
                    title={!isExpanded ? item.label : undefined}
                    className={`group flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium
                        transition-colors ${
                        item.active
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                >
                    <span className={`shrink-0 ${!isExpanded ? 'mx-auto' : ''}`}>{item.icon}</span>
                    {isExpanded && (
                        <>
                            <span className="flex-1 text-start">{item.label}</span>
                            <span className="ms-auto shrink-0">
                                {openGroups[item.key]
                                    ? <FaChevronUp size={11} />
                                    : <FaChevronDown size={11} />}
                            </span>
                        </>
                    )}
                </button>

                {/* Sub-items */}
                {isExpanded && openGroups[item.key] && (
                    <ul className="ms-3 mt-1 space-y-0.5 border-s-2 border-indigo-200 ps-2 dark:border-indigo-800">
                        {item.children.map((child) => (
                            <li key={child.key}>
                                <CategorySubItem child={child} />
                            </li>
                        ))}
                    </ul>
                )}
            </li>
        ) : (
            <li key={item.key}>
                <Link
                    href={item.href}
                    onClick={pinOpen}
                    title={!isExpanded ? item.label : undefined}
                    className={`group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium
                        transition-colors ${
                        item.current
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                >
                    <span className={`shrink-0 ${!isExpanded ? 'mx-auto' : ''}`}>{item.icon}</span>
                    {isExpanded && <span>{item.label}</span>}
                </Link>
            </li>
        )
    );

    /* ─────────────────────────────────────────────────────────────────
       Watermark
    ───────────────────────────────────────────────────────────────── */
    const watermark = (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none justify-center pb-6">
            <img src="/logo_br.png" alt="" className="w-40 max-w-[70%] opacity-[0.12] dark:opacity-[0.16]" />
        </div>
    );

    return (
        <>
            {/* ══════════════════════════════════════════════════════════
                MOBILE sidebar
            ══════════════════════════════════════════════════════════ */}
            <div className={`fixed inset-y-0 start-0 z-50 w-64 transform bg-white dark:bg-gray-800
                transition-transform duration-300 ease-in-out lg:hidden ${
                mobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
            }`}>
                <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <ApplicationLogo logo_img="/logo_name_br.png" className="h-9 w-auto" />
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="relative mt-4 px-3">
                    <ul className="space-y-1">{renderNav(true)}</ul>
                </nav>
                {watermark}
            </div>

            {/* ══════════════════════════════════════════════════════════
                DESKTOP sidebar
                - Pinned open  → w-64, static
                - Pinned closed → w-20, expands to w-64 on hover (overlay)
            ══════════════════════════════════════════════════════════ */}
            <div
                className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col
                    transition-all duration-300 ease-in-out ${expanded ? 'lg:w-64' : 'lg:w-20'}`}
                onMouseEnter={() => !sidebarOpen && setHovered(true)}
                onMouseLeave={() => !sidebarOpen && setHovered(false)}
            >
                <div className={`flex grow flex-col overflow-y-auto border-e border-gray-200 bg-white
                    dark:border-gray-700 dark:bg-gray-800 transition-shadow duration-300 ${
                    /* Float above content when hover-expanded but not pinned */
                    hovered && !sidebarOpen ? 'shadow-[4px_0_24px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)]' : ''
                }`}>

                    {/* Header */}
                    <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                        {expanded && (
                            <ApplicationLogo logo_img="/logo_name_br.png" className="h-9 w-auto" />
                        )}
                        {/* Toggle pin button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={sidebarOpen ? 'Collapse' : 'Pin open'}
                            className={`rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500
                                dark:hover:bg-gray-700 ${!expanded ? 'mx-auto' : ''}`}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d={sidebarOpen
                                        ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
                                        : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
                            </svg>
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="relative flex flex-1 flex-col gap-y-5 px-3 py-4">
                        <ul className="space-y-1">{renderNav(expanded)}</ul>
                    </nav>

                    {watermark}
                </div>
            </div>
        </>
    );
}

export default Sidebar;
