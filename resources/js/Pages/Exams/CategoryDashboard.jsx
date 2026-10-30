import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CourseForm from '@/Pages/Courses/CourseForm';
import TestForm from '@/Pages/Tests/TestForm';
import Modal from '@/Components/Modal';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaBook, FaClipboardCheck, FaClipboardList,
    FaPlus, FaTimes, FaEdit, FaTrash, FaFilePdf,
} from 'react-icons/fa';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

const STATUS_COLORS = {
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    draft:     'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    archived:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const inLanguage = (rtl, ar, fr) => (rtl ? ar || fr : fr || ar);

export default function CategoryDashboard({ category, courses, tests, exams, categories, questions }) {
    const { t, i18n } = useTranslation();
    const rtl = (i18n.language ?? '').startsWith('ar');

    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [courseFormOpen, setCourseFormOpen]  = useState(false);
    const [editingCourse,  setEditingCourse]   = useState(null);
    const [testFormOpen,   setTestFormOpen]    = useState(false);
    const [editingTest,    setEditingTest]     = useState(null);
    const [deletingItem,   setDeletingItem]    = useState(null);

    const categoryName = inLanguage(rtl, category.nameAr, category.nameFr) || category.code;

    /* Merge all three types into one sorted list */
    const allItems = [
        ...courses.map(c => ({ ...c, _type: 'course',
            _icon: FaBook,
            _iconColor: 'text-indigo-500',
            _iconBg:    'bg-indigo-100/80 dark:bg-indigo-900/40',
            _gradient:  'from-indigo-500 to-indigo-700',
        })),
        ...tests.map(t => ({ ...t, _type: 'test',
            _icon: FaClipboardCheck,
            _iconColor: 'text-emerald-500',
            _iconBg:    'bg-emerald-100/80 dark:bg-emerald-900/40',
            _gradient:  'from-emerald-500 to-emerald-700',
        })),
        ...exams.map(e => ({ ...e, _type: 'exam',
            _icon: FaClipboardList,
            _iconColor: 'text-blue-500',
            _iconBg:    'bg-blue-100/80 dark:bg-blue-900/40',
            _gradient:  'from-blue-500 to-blue-700',
        })),
    ].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

    /* Handlers */
    const openCreateCourse = () => { setCreateMenuOpen(false); setEditingCourse(null); setCourseFormOpen(true); };
    const openEditCourse   = (c) => { setEditingCourse(c); setCourseFormOpen(true); };
    const openCreateTest   = () => { setCreateMenuOpen(false); setEditingTest(null); setTestFormOpen(true); };
    const openEditTest     = (t) => { setEditingTest(t); setTestFormOpen(true); };

    const confirmDelete = () => {
        if (!deletingItem) return;
        const routeName = deletingItem._type === 'course' ? 'courses.destroy' : 'tests.destroy';
        router.delete(route(routeName, deletingItem.id), {
            preserveScroll: true,
            onFinish: () => setDeletingItem(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-x-4">
                    <div className="flex items-center gap-x-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                            <FaClipboardList size={18} />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                                {categoryName}
                            </h2>
                            <p className="font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                {t('categoryDashboard.category')} · {category.code}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreateMenuOpen(true)}
                        className="inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                    >
                        <FaPlus size={13} />
                        {t('categoryDashboard.createNew')}
                    </button>
                </div>
            }
        >
            <Head title={categoryName} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

                    {/* ── Stat cards ─────────────────────────────────────────── */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { label: t('categoryDashboard.courses'), count: courses.length, gradient: 'from-indigo-500 to-indigo-600', ring: 'bg-indigo-50 dark:bg-indigo-900/20', Icon: FaBook },
                            { label: t('categoryDashboard.tests'),   count: tests.length,   gradient: 'from-emerald-500 to-emerald-600', ring: 'bg-emerald-50 dark:bg-emerald-900/20', Icon: FaClipboardCheck },
                            { label: t('categoryDashboard.exams'),   count: exams.length,   gradient: 'from-blue-500 to-blue-600',       ring: 'bg-blue-50 dark:bg-blue-900/20',       Icon: FaClipboardList },
                        ].map(({ label, count, gradient, ring, Icon }) => (
                            <div key={label} className={`${panel} group relative overflow-hidden p-6 transition-all hover:shadow-lg`}>
                                {/* Decorative circle */}
                                <div className={`absolute -right-5 -top-5 h-28 w-28 rounded-full ${ring} transition-transform group-hover:scale-110`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                                        <p className="mt-1.5 text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{count}</p>
                                    </div>
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                                        <Icon size={24} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── All content ─────────────────────────────────────────── */}
                    <div className={`${panel} p-6`}>
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {t('categoryDashboard.allContent')}
                                <span className="ms-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {allItems.length}
                                </span>
                            </h3>
                        </div>

                        {allItems.length === 0 ? (
                            /* ── Empty state ── */
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 dark:border-gray-700">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <FaClipboardList size={32} className="text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {t('categoryDashboard.noContent')}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {t('categoryDashboard.noContentHelp')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setCreateMenuOpen(true)}
                                    className="mt-6 inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                                >
                                    <FaPlus size={13} />
                                    {t('categoryDashboard.createFirst')}
                                </button>
                            </div>
                        ) : (
                            /* ── Grid ── */
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {allItems.map((item) => (
                                    <ContentCard
                                        key={`${item._type}-${item.id}`}
                                        item={item}
                                        rtl={rtl}
                                        t={t}
                                        onEdit={
                                            item._type === 'course' ? openEditCourse :
                                            item._type === 'test'   ? openEditTest   : null
                                        }
                                        onDelete={item._type !== 'exam' ? setDeletingItem : null}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Create-type chooser ─────────────────────────────────────── */}
            <Modal show={createMenuOpen} maxWidth="sm" onClose={() => setCreateMenuOpen(false)}>
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('categoryDashboard.chooseType')}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {categoryName}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreateMenuOpen(false)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Course */}
                        <button
                            type="button"
                            onClick={openCreateCourse}
                            className="flex w-full items-center gap-x-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 p-4 text-start transition-all hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:hover:border-indigo-700"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow">
                                <FaBook size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('categoryDashboard.createCourse')}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {t('categoryDashboard.courseDesc')}
                                </p>
                            </div>
                        </button>

                        {/* Test */}
                        <button
                            type="button"
                            onClick={openCreateTest}
                            className="flex w-full items-center gap-x-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 p-4 text-start transition-all hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:hover:border-emerald-700"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow">
                                <FaClipboardCheck size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('categoryDashboard.createTest')}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {t('categoryDashboard.testDesc')}
                                </p>
                            </div>
                        </button>

                        {/* Exam – coming soon */}
                        <div className="flex w-full items-center gap-x-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-50 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow">
                                <FaClipboardList size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('categoryDashboard.createExam')}
                                    <span className="ms-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                        {t('common.comingSoon')}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {t('categoryDashboard.examDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Course form ─────────────────────────────────────────────── */}
            <CourseForm
                show={courseFormOpen}
                course={editingCourse}
                category={category}
                categories={categories}
                onClose={() => { setCourseFormOpen(false); setEditingCourse(null); }}
            />

            {/* ── Test form ───────────────────────────────────────────────── */}
            <TestForm
                show={testFormOpen}
                test={editingTest}
                category={category}
                categories={categories}
                questions={questions}
                onClose={() => { setTestFormOpen(false); setEditingTest(null); }}
            />

            {/* ── Delete confirm ──────────────────────────────────────────── */}
            <Modal show={deletingItem !== null} maxWidth="sm" onClose={() => setDeletingItem(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('categoryDashboard.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('categoryDashboard.deleteHelp', {
                            name: deletingItem ? inLanguage(rtl, deletingItem.nameAr, deletingItem.nameFr) : '',
                        })}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <button
                            type="button"
                            onClick={() => setDeletingItem(null)}
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

/* ─── ContentCard ──────────────────────────────────────────────────────────── */
function ContentCard({ item, rtl, t, onEdit, onDelete }) {
    const title = inLanguage(rtl, item.nameAr, item.nameFr);
    const Icon  = item._icon;

    return (
        <div className={`${panel} group flex flex-col overflow-hidden transition-all hover:shadow-lg`}>

            {/* ── Thumbnail ── */}
            <div className="relative h-40 overflow-hidden">
                {item.coverUrl ? (
                    <img
                        src={item.coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item._gradient} opacity-10 dark:opacity-20`}>
                        <Icon size={64} className="text-gray-900 dark:text-white opacity-30" />
                    </div>
                )}

                {/* Type pill – top-left */}
                <span className={`absolute left-3 top-3 inline-flex items-center gap-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm ${item._iconBg} ${item._iconColor}`}>
                    <Icon size={11} />
                    {t(`categoryDashboard.type_${item._type}`)}
                </span>

                {/* Status pill – top-right */}
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${STATUS_COLORS[item.status] ?? STATUS_COLORS.draft}`}>
                    {t(`courses.status_${item.status}`)}
                </span>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 flex-col gap-y-2 p-4">

                <h4
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                    {title}
                </h4>

                {/* Meta row */}
                {(item.questionsCount !== undefined || item.duration) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.questionsCount !== undefined && (
                            <span className="inline-flex items-center gap-x-1">
                                <FaClipboardCheck size={10} />
                                {item.questionsCount} {t('tests.questions')}
                            </span>
                        )}
                        {item.duration && (
                            <span className="inline-flex items-center gap-x-1">
                                · {item.duration} {t('tests.minutes')}
                            </span>
                        )}
                    </div>
                )}

                {/* PDF links for courses */}
                {item._type === 'course' && (item.pdfFrUrl || item.pdfArUrl) && (
                    <div className="flex flex-wrap gap-1.5">
                        {item.pdfFrUrl && (
                            <a
                                href={item.pdfFrUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-x-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <FaFilePdf size={10} className="text-red-500" /> PDF FR
                            </a>
                        )}
                        {item.pdfArUrl && (
                            <a
                                href={item.pdfArUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-x-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <FaFilePdf size={10} className="text-red-500" /> PDF AR
                            </a>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                {(onEdit || onDelete) && (
                    <div className="mt-auto flex gap-x-2 pt-2">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="flex flex-1 items-center justify-center gap-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <FaEdit size={11} />
                                {t('common.edit')}
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                                <FaTrash size={11} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
