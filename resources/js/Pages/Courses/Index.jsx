import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CourseForm from './CourseForm';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaBook,
    FaEdit,
    FaFilePdf,
    FaInbox,
    FaPlus,
    FaSearch,
    FaTrash,
} from 'react-icons/fa';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';
const cell  = 'border-b border-gray-100 py-4 pe-4 align-middle dark:border-gray-700';

const inLanguage = (rtl, ar, fr) => (rtl ? ar || fr : fr || ar);

const STATUS_COLORS = {
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    draft:     'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    archived:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function Index({ courses, filters, stats, categories }) {
    const { t, i18n } = useTranslation();
    const rtl   = (i18n.language ?? '').startsWith('ar');
    const flash = usePage().props.flash;
    const errors = usePage().props.errors;

    const [search, setSearch]     = useState(filters.search ?? '');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing]   = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [notice, setNotice]     = useState(null);
    const firstRender = useRef(true);

    const query = {
        search:   filters.search,
        category: filters.category ?? '',
        status:   filters.status ?? '',
    };

    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        const timer = setTimeout(() => {
            router.reload({ only: ['courses', 'filters'], data: { ...query, search }, preserveState: true, preserveScroll: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (flash?.success) setNotice({ tone: 'success', text: t(`courses.flash.${flash.success}`) });
    }, [flash?.success]);

    useEffect(() => {
        if (errors.courses) setNotice({ tone: 'error', text: errors.courses });
    }, [errors.courses]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const applyFilter = (changes) =>
        router.reload({ only: ['courses', 'filters'], data: { ...query, ...changes }, preserveScroll: true });

    const openCreate = () => { setEditing(null); setFormOpen(true); };
    const openEdit   = (course) => { setEditing(course); setFormOpen(true); };

    const confirmDelete = () => {
        router.delete(route('courses.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                            {t('courses.title')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('courses.subtitle')}</p>
                    </div>
                    <PrimaryButton type="button" onClick={openCreate}>
                        <FaPlus className="me-2" size={12} />
                        {t('courses.create')}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={t('courses.title')} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">

                    {notice && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                            notice.tone === 'success'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100'
                                : 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-100'
                        }`}>
                            {notice.text}
                        </div>
                    )}

                    {/* Stat cards */}
                    <div className={`${panel} grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
                        {[
                            ['total',     t('courses.total')],
                            ['published', t('courses.published')],
                            ['draft',     t('courses.draft')],
                        ].map(([key, label]) => (
                            <div key={key} className="flex items-baseline gap-x-2 px-5 py-4">
                                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats[key]}</span>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className={`${panel} space-y-4 p-5`}>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                            {/* Search */}
                            <div className="relative min-w-[16rem] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                                    <FaSearch size={14} />
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('courses.searchPlaceholder')}
                                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-4 ps-11 text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Category filter */}
                            <select
                                value={query.category}
                                onChange={(e) => applyFilter({ category: e.target.value })}
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">{t('courses.allCategories')}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code} – {inLanguage(rtl, cat.nameAr, cat.nameFr)}
                                    </option>
                                ))}
                            </select>

                            {/* Status filter */}
                            <div className="inline-flex rounded-xl border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-900">
                                {[
                                    { value: '', labelKey: 'courses.all' },
                                    { value: 'published', labelKey: 'courses.published' },
                                    { value: 'draft',     labelKey: 'courses.draft' },
                                    { value: 'archived',  labelKey: 'courses.archived' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value || 'all'}
                                        type="button"
                                        onClick={() => applyFilter({ status: opt.value })}
                                        className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                                            query.status === opt.value
                                                ? 'bg-[#007BFF] text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        {t(opt.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-start">
                                <thead>
                                    <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        <th className={`${cell} ps-1 text-start`}>{t('courses.cover')}</th>
                                        <th className={`${cell} text-start`}>{t('courses.name')}</th>
                                        <th className={`${cell} text-start`}>{t('courses.category')}</th>
                                        <th className={`${cell} text-start`}>{t('courses.pdfs')}</th>
                                        <th className={`${cell} text-start`}>{t('courses.status')}</th>
                                        <th className={`${cell} text-end`}>{t('courses.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.data.map((course) => (
                                        <tr key={course.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className={`${cell} ps-1`}>
                                                {course.coverUrl ? (
                                                    <img src={course.coverUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                                                ) : (
                                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                        <FaBook size={16} className="text-gray-300 dark:text-gray-600" />
                                                    </span>
                                                )}
                                            </td>
                                            <td className={cell}>
                                                <p dir={rtl ? 'rtl' : 'ltr'} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {inLanguage(rtl, course.nameAr, course.nameFr)}
                                                </p>
                                                <p dir={rtl ? 'ltr' : 'rtl'} className="text-xs text-gray-500 dark:text-gray-400">
                                                    {inLanguage(!rtl, course.nameAr, course.nameFr)}
                                                </p>
                                            </td>
                                            <td className={cell}>
                                                {course.categoryCode ? (
                                                    <span className="rounded-lg bg-[#007BFF]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]">
                                                        {course.categoryCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className={cell}>
                                                <div className="flex items-center gap-x-2">
                                                    {course.pdfFrUrl && (
                                                        <a href={course.pdfFrUrl} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-x-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                                                            <FaFilePdf size={11} className="text-red-500" /> FR
                                                        </a>
                                                    )}
                                                    {course.pdfArUrl && (
                                                        <a href={course.pdfArUrl} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-x-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                                                            <FaFilePdf size={11} className="text-red-500" /> AR
                                                        </a>
                                                    )}
                                                    {!course.pdfFrUrl && !course.pdfArUrl && (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={cell}>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[course.status] ?? STATUS_COLORS.draft}`}>
                                                    {t(`courses.status_${course.status}`)}
                                                </span>
                                            </td>
                                            <td className={`${cell} text-end`}>
                                                <span className="flex items-center justify-end gap-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(course)}
                                                        title={t('courses.edit')}
                                                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#007BFF]/10 hover:text-[#007BFF] dark:text-gray-300 dark:hover:bg-[#00AEEF]/15 dark:hover:text-[#00AEEF]"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(course)}
                                                        title={t('courses.delete')}
                                                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {courses.data.length === 0 && (
                                <div className="py-14 text-center">
                                    <FaInbox size={22} className="mx-auto text-gray-300 dark:text-gray-600" />
                                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('courses.empty')}</p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('courses.emptyHelp')}</p>
                                    <div className="mt-5">
                                        <PrimaryButton type="button" onClick={openCreate}>
                                            <FaPlus className="me-2" size={12} />
                                            {t('courses.create')}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {courses.last_page > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {courses.from}–{courses.to} / {courses.total}
                                </p>
                                <div className="flex gap-x-1">
                                    {courses.links.map((link, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                                link.active
                                                    ? 'bg-[#007BFF] text-white'
                                                    : link.url
                                                        ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                                        : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CourseForm
                show={formOpen}
                course={editing}
                categories={categories}
                onClose={() => { setFormOpen(false); setEditing(null); }}
            />

            {/* Delete confirmation */}
            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('courses.deleteTitle')}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('courses.deleteHelp', { name: inLanguage(rtl, deleting?.nameAr, deleting?.nameFr) })}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <button
                            type="button"
                            onClick={() => setDeleting(null)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            {t('common.confirm')}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
