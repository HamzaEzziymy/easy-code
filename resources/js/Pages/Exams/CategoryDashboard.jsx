import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CourseForm from '@/Pages/Courses/CourseForm';
import TestForm from '@/Pages/Tests/TestForm';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaSearch } from 'react-icons/fa';
import {
    FaBook,
    FaChevronLeft,
    FaChevronRight,
    FaCircleQuestion,
    FaClipboardCheck,
    FaClipboardList,
    FaFilePdf,
    FaPlus,
    FaTrash,
    FaXmark,
} from 'react-icons/fa6';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

const inLanguage = (rtl, ar, fr) => (rtl ? ar || fr : fr || ar);

const STATUS_COLORS = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    draft:     'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    archived:  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

/* Segmented filter — identical to Questions/Index */
function Segmented({ label, value, options, onChange }) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {label}
            </span>
            <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                {options.map((opt) => (
                    <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                            value === opt.value
                                ? 'bg-[#007BFF] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                    >
                        {t(opt.labelKey)}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function CategoryDashboard({ category, courses, tests, exams, categories, questions }) {
    const { t, i18n } = useTranslation();
    const rtl   = i18n.language?.startsWith('ar');
    const flash  = usePage().props.flash;
    const errors = usePage().props.errors;

    /* ── UI state ─────────────────────────────────────────────────────── */
    const [search,          setSearch]          = useState('');
    const [typeFilter,      setTypeFilter]      = useState('');
    const [statusFilter,    setStatusFilter]    = useState('');
    const [createMenuOpen,  setCreateMenuOpen]  = useState(false);
    const [courseFormOpen,  setCourseFormOpen]  = useState(false);
    const [editingCourse,   setEditingCourse]   = useState(null);
    const [testFormOpen,    setTestFormOpen]    = useState(false);
    const [editingTest,     setEditingTest]     = useState(null);
    const [deleting,        setDeleting]        = useState(null);
    const [notice,          setNotice]          = useState(null);
    const [page,            setPage]            = useState(1);
    const PER_PAGE = 12;
    const firstRender = useRef(true);

    const categoryName = inLanguage(rtl, category.nameAr, category.nameFr) || category.code;

    /* ── Flash / error notices ─────────────────────────────────────────── */
    useEffect(() => {
        if (flash?.success)
            setNotice({ tone: 'success', text: t(`categoryDashboard.flash.${flash.success}`) });
    }, [flash?.success]);

    useEffect(() => {
        const msg = errors?.categoryDashboard;
        if (msg) setNotice({ tone: 'error', text: msg });
    }, [errors?.categoryDashboard]);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(timer);
    }, [notice]);

    /* ── Reset page when filters change ────────────────────────────────── */
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        setPage(1);
    }, [search, typeFilter, statusFilter]);

    /* ── Combine & filter all items ────────────────────────────────────── */
    const allRaw = [
        ...courses.map(c => ({ ...c, _type: 'course' })),
        ...tests.map(t  => ({ ...t, _type: 'test' })),
        ...exams.map(e  => ({ ...e, _type: 'exam' })),
    ];

    const filtered = allRaw.filter(item => {
        if (typeFilter   && item._type !== typeFilter)   return false;
        if (statusFilter && item.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            const title = (item.nameFr ?? item.titleFr ?? '') + ' ' + (item.nameAr ?? item.titleAr ?? '');
            if (!title.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage    = Math.min(page, totalPages);
    const pageItems   = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    /* ── Handlers ──────────────────────────────────────────────────────── */
    const openCreateCourse = () => { setCreateMenuOpen(false); setEditingCourse(null); setCourseFormOpen(true); };
    const openEditCourse   = (c) => { setEditingCourse(c); setCourseFormOpen(true); };
    const openCreateTest   = () => { setCreateMenuOpen(false); setEditingTest(null); setTestFormOpen(true); };
    const openEditTest     = (t) => { setEditingTest(t); setTestFormOpen(true); };

    const confirmDelete = () => {
        if (!deleting) return;
        const routeName = deleting._type === 'course' ? 'courses.destroy' : 'tests.destroy';
        router.delete(route(routeName, deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    /* ── Pagination links builder ──────────────────────────────────────── */
    const paginationLinks = () => {
        const links = [];
        links.push({ label: 'prev', page: safePage - 1, disabled: safePage <= 1 });
        for (let i = 1; i <= totalPages; i++) links.push({ label: String(i), page: i, active: i === safePage });
        links.push({ label: 'next', page: safePage + 1, disabled: safePage >= totalPages });
        return links;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            {categoryName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {t('categoryDashboard.subtitle')}
                            <span className="ms-2 font-mono font-bold text-[#007BFF] dark:text-[#7EB8F5]">
                                {category.code}
                            </span>
                        </p>
                    </div>
                    <PrimaryButton type="button" onClick={() => setCreateMenuOpen(true)}>
                        <FaPlus className="me-2" size={12} />
                        {t('categoryDashboard.createNew')}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={categoryName} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">

                    {/* ── Flash notice ─────────────────────────────────── */}
                    {notice && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                            notice.tone === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200'
                        }`}>
                            {notice.text}
                        </div>
                    )}

                    {/* ── Stat cards — same style as Questions/Index ────── */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                            <div className="flex items-center gap-x-2">
                                <FaBook size={14} className="text-indigo-500 dark:text-indigo-400" />
                                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{courses.length}</p>
                            </div>
                            <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{t('categoryDashboard.courses')}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                            <div className="flex items-center gap-x-2">
                                <FaClipboardCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{tests.length}</p>
                            </div>
                            <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('categoryDashboard.tests')}</p>
                        </div>
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                            <div className="flex items-center gap-x-2">
                                <FaClipboardList size={14} className="text-blue-500 dark:text-blue-400" />
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{exams.length}</p>
                            </div>
                            <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">{t('categoryDashboard.exams')}</p>
                        </div>
                    </div>

                    {/* ── Filter bar ───────────────────────────────────── */}
                    <div className={`${panel} space-y-4 p-4`}>
                        {/* Search */}
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                                <FaSearch size={14} />
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('categoryDashboard.searchPlaceholder')}
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-11 ps-11 text-sm text-gray-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <FaXmark size={14} />
                                </button>
                            )}
                        </div>

                        {/* Segmented filters */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <Segmented
                                label={t('categoryDashboard.filterType')}
                                value={typeFilter}
                                onChange={setTypeFilter}
                                options={[
                                    { value: '',       labelKey: 'categoryDashboard.all' },
                                    { value: 'course', labelKey: 'categoryDashboard.type_course' },
                                    { value: 'test',   labelKey: 'categoryDashboard.type_test' },
                                    { value: 'exam',   labelKey: 'categoryDashboard.type_exam' },
                                ]}
                            />
                            <Segmented
                                label={t('categoryDashboard.filterStatus')}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    { value: '',          labelKey: 'categoryDashboard.all' },
                                    { value: 'published', labelKey: 'courses.status_published' },
                                    { value: 'draft',     labelKey: 'courses.status_draft' },
                                    { value: 'archived',  labelKey: 'courses.status_archived' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* ── Content cards grid ───────────────────────────── */}
                    <div className={`${panel} overflow-hidden`}>
                        <div className="p-5">
                            {pageItems.length === 0 ? (
                                <div className="py-14 text-center">
                                    <FaCircleQuestion size={26} className="mx-auto text-gray-300 dark:text-gray-600" />
                                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('categoryDashboard.noContent')}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {t('categoryDashboard.noContentHelp')}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {pageItems.map(item => (
                                        <ItemCard
                                            key={`${item._type}-${item.id}`}
                                            item={item}
                                            rtl={rtl}
                                            t={t}
                                            onEdit={
                                                item._type === 'course' ? openEditCourse :
                                                item._type === 'test'   ? openEditTest   : null
                                            }
                                            onDelete={item._type !== 'exam' ? setDeleting : null}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Pagination — same markup as Questions/Index ── */}
                        {totalPages > 1 && (
                            <nav className="flex flex-wrap items-center justify-center gap-x-1 border-t border-gray-100 py-4 dark:border-gray-700">
                                {paginationLinks().map((link, idx) => {
                                    if (link.label === 'prev') return (
                                        <button key="prev" type="button" disabled={link.disabled}
                                            onClick={() => !link.disabled && setPage(link.page)}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${link.disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'}`}
                                        >
                                            <FaChevronLeft className="rtl:-scale-x-100" size={12} />
                                        </button>
                                    );
                                    if (link.label === 'next') return (
                                        <button key="next" type="button" disabled={link.disabled}
                                            onClick={() => !link.disabled && setPage(link.page)}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${link.disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'}`}
                                        >
                                            <FaChevronRight className="rtl:-scale-x-100" size={12} />
                                        </button>
                                    );
                                    return (
                                        <button key={link.label} type="button"
                                            onClick={() => setPage(link.page)}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${link.active ? 'bg-[#007BFF] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'}`}
                                        >
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Create-type chooser modal ─────────────────────────────── */}
            <Modal show={createMenuOpen} maxWidth="sm" onClose={() => setCreateMenuOpen(false)}>
                <div className="p-6">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('categoryDashboard.chooseType')}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {categoryName} · <span className="font-mono font-bold text-[#007BFF]">{category.code}</span>
                            </p>
                        </div>
                        <button type="button" onClick={() => setCreateMenuOpen(false)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                            <FaXmark size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Course */}
                        <button type="button" onClick={openCreateCourse}
                            className="flex w-full items-center gap-x-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 p-4 text-start transition-all hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:hover:border-indigo-700">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
                                <FaBook size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{t('categoryDashboard.createCourse')}</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('categoryDashboard.courseDesc')}</p>
                            </div>
                        </button>

                        {/* Test */}
                        <button type="button" onClick={openCreateTest}
                            className="flex w-full items-center gap-x-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 p-4 text-start transition-all hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:hover:border-emerald-700">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                                <FaClipboardCheck size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{t('categoryDashboard.createTest')}</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('categoryDashboard.testDesc')}</p>
                            </div>
                        </button>

                        {/* Exam — coming soon */}
                        <div className="flex w-full items-center gap-x-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-50 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#007BFF] text-white shadow">
                                <FaClipboardList size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('categoryDashboard.createExam')}
                                    <span className="ms-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                        {t('common.comingSoon')}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('categoryDashboard.examDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Course form ────────────────────────────────────────────── */}
            <CourseForm
                show={courseFormOpen}
                course={editingCourse}
                category={category}
                categories={categories}
                onClose={() => { setCourseFormOpen(false); setEditingCourse(null); }}
            />

            {/* ── Test form ──────────────────────────────────────────────── */}
            <TestForm
                show={testFormOpen}
                test={editingTest}
                category={category}
                categories={categories}
                questions={questions}
                onClose={() => { setTestFormOpen(false); setEditingTest(null); }}
            />

            {/* ── Delete confirm — same as Questions/Index ───────────────── */}
            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('categoryDashboard.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('categoryDashboard.deleteHelp')}
                    </p>
                    <p dir={rtl ? 'rtl' : 'ltr'} className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {deleting ? inLanguage(rtl, deleting.nameAr, deleting.nameFr) : ''}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <SecondaryButton onClick={() => setDeleting(null)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmDelete}>{t('common.confirm')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

/* ─── Item Card ────────────────────────────────────────────────────────────── */
function ItemCard({ item, rtl, t, onEdit, onDelete }) {
    const title = inLanguage(rtl, item.nameAr ?? item.titleAr, item.nameFr ?? item.titleFr);

    const TYPE_META = {
        course: { Icon: FaBook,          label: 'categoryDashboard.type_course', color: 'text-indigo-500', bg: 'bg-indigo-100/80 dark:bg-indigo-900/40', placeholder: 'from-indigo-100 to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-900/40' },
        test:   { Icon: FaClipboardCheck, label: 'categoryDashboard.type_test',   color: 'text-emerald-500', bg: 'bg-emerald-100/80 dark:bg-emerald-900/40', placeholder: 'from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/40' },
        exam:   { Icon: FaClipboardList,  label: 'categoryDashboard.type_exam',   color: 'text-blue-500',    bg: 'bg-blue-100/80 dark:bg-blue-900/40',    placeholder: 'from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-900/40' },
    };
    const meta = TYPE_META[item._type] ?? TYPE_META.exam;
    const { Icon } = meta;

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">

            {/* ── Thumbnail ── */}
            <div className="relative h-36 overflow-hidden">
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${meta.placeholder}`}>
                        <Icon size={40} className={`${meta.color} opacity-30`} />
                    </div>
                )}

                {/* Type pill — top left */}
                <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${meta.bg} ${meta.color}`}>
                    <Icon size={10} />
                    {t(meta.label)}
                </span>

                {/* Status pill — top right */}
                <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${STATUS_COLORS[item.status] ?? STATUS_COLORS.draft}`}>
                    {t(`courses.status_${item.status}`)}
                </span>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 flex-col gap-y-2 p-4">
                <h4 dir={rtl ? 'rtl' : 'ltr'} className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                </h4>

                {/* Meta row */}
                {(item.questionsCount !== undefined || item.duration) && (
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                        {item.questionsCount !== undefined && (
                            <span className="inline-flex items-center gap-x-1">
                                <FaClipboardCheck size={10} />
                                {item.questionsCount} {t('tests.questions')}
                            </span>
                        )}
                        {item.duration && (
                            <span>· {item.duration} {t('tests.minutes')}</span>
                        )}
                    </div>
                )}

                {/* PDFs for courses */}
                {item._type === 'course' && (item.pdfFrUrl || item.pdfArUrl) && (
                    <div className="flex flex-wrap gap-1.5">
                        {item.pdfFrUrl && (
                            <a href={item.pdfFrUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-x-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                <FaFilePdf size={10} className="text-red-500" /> PDF FR
                            </a>
                        )}
                        {item.pdfArUrl && (
                            <a href={item.pdfArUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-x-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                <FaFilePdf size={10} className="text-red-500" /> PDF AR
                            </a>
                        )}
                    </div>
                )}

                {/* Actions */}
                {(onEdit || onDelete) && (
                    <div className="mt-auto flex gap-x-2 pt-2">
                        {onEdit && (
                            <button type="button" onClick={() => onEdit(item)}
                                title={t('common.edit')}
                                className="flex flex-1 items-center justify-center gap-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                                <FaEdit size={11} />
                                {t('common.edit')}
                            </button>
                        )}
                        {onDelete && (
                            <button type="button" onClick={() => onDelete(item)}
                                title={t('common.delete')}
                                className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30">
                                <FaTrash size={11} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
