import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

export default function Index({ categories, filters, stats }) {
    const { t } = useTranslation();
    const flash = usePage().props.flash;
    const errors = usePage().props.errors;

    const [search, setSearch] = useState(filters.search);
    const [deleting, setDeleting] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const firstRender = useRef(true);

    const query = { search: filters.search, status: filters.status ?? '' };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.reload({
                only: ['categories', 'filters'],
                data: { ...query, search },
                preserveState: true,
                preserveScroll: true,
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!flash?.success) {
            return;
        }
        setNotice({ tone: 'success', text: t(`categories.flash.${flash.success}`) });
    }, [flash?.success, t]);

    useEffect(() => {
        const message = errors.categories;

        if (!message) {
            return;
        }
        setNotice({ tone: 'error', text: message });
    }, [errors.categories]);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = setTimeout(() => setNotice(null), 4000);

        return () => clearTimeout(timer);
    }, [notice]);

    const applyFilter = (changes) =>
        router.reload({
            only: ['categories', 'filters'],
            data: { ...query, ...changes },
            preserveScroll: true,
        });

    const toggleActive = (category) => {
        setBusyId(category.id);
        router.patch(route('categories.toggleActive', category.id), {}, {
            preserveScroll: true,
            only: ['categories', 'stats'],
            onFinish: () => setBusyId(null),
        });
    };

    const confirmDelete = () => {
        setBusyId(deleting.id);
        router.delete(route('categories.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusyId(null);
                setDeleting(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                            {t('categories.title')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('categories.subtitle')}</p>
                    </div>
                    <Link href={route('categories.create')}>
                        <PrimaryButton type="button">
                            <FaPlus className="me-2" size={12} />
                            {t('categories.create')}
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('categories.title')} />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {notice && (
                        <div
                            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                                notice.tone === 'success'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100'
                                    : 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-100'
                            }`}
                        >
                            {notice.text}
                        </div>
                    )}

                    <div className={`${panel} grid gap-4 p-5 sm:grid-cols-3`}>
                        {[
                            ['total', t('categories.title')],
                            ['active', t('categories.active')],
                            ['trainees', t('categories.trainees')],
                        ].map(([key, label]) => (
                            <div key={key} className="flex items-baseline gap-x-2">
                                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {stats[key]}
                                </span>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className={`${panel} space-y-4 p-5`}>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                            <div className="relative min-w-[16rem] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                                    <FaSearch size={14} />
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={t('categories.searchPlaceholder')}
                                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-4 ps-11 text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div className="inline-flex rounded-xl border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-900">
                                {[
                                    { value: '', labelKey: 'categories.all' },
                                    { value: 'active', labelKey: 'categories.active' },
                                    { value: 'inactive', labelKey: 'categories.inactive' },
                                ].map((option) => (
                                    <button
                                        key={option.value || 'all'}
                                        type="button"
                                        onClick={() => applyFilter({ status: option.value })}
                                        className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                                            query.status === option.value
                                                ? 'bg-[#007BFF] text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        {t(option.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="-mx-4 overflow-x-auto px-4">
                            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-start">
                                <thead>
                                    <tr>
                                        {[
                                            t('categories.code'),
                                            t('categories.names'),
                                            t('categories.usage'),
                                            t('categories.status'),
                                        ].map((label, index) => (
                                            <th
                                                key={index}
                                                className={`border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:text-gray-300 ${
                                                    index === 3 ? 'text-end' : 'pe-3 text-start'
                                                }`}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr key={category.id} className="group">
                                            <td className="border-b border-gray-100 py-3 pe-3 align-middle dark:border-gray-700">
                                                <span className="inline-flex items-center gap-x-2">
                                                    {category.iconUrl && (
                                                        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
                                                            <img
                                                                src={category.iconUrl}
                                                                alt=""
                                                                className="h-full w-full object-contain"
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#007BFF]/10 font-mono text-sm font-bold text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]">
                                                        {category.code}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="border-b border-gray-100 py-3 pe-3 align-middle dark:border-gray-700">
                                                <Link
                                                    href={route('categories.edit', category.id)}
                                                    className="text-sm font-semibold text-gray-900 hover:text-[#007BFF] dark:text-gray-100"
                                                >
                                                    {category.nameFr}
                                                </Link>
                                                <p className="text-sm text-gray-700 dark:text-gray-300" dir="rtl">
                                                    {category.nameAr}
                                                </p>
                                                {(category.conditionFr || category.conditionAr) && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                                                        {category.conditionFr || category.conditionAr}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="border-b border-gray-100 py-3 pe-3 align-middle text-sm text-gray-800 dark:border-gray-700 dark:text-gray-200">
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                                    <span>
                                                        {category.studentsCount} {t('categories.trainees')}
                                                    </span>
                                                    <span>
                                                        {category.examsCount} {t('categories.exams')}
                                                    </span>
                                                    <span>
                                                        {category.questionsCount} {t('categories.questions')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-b border-gray-100 py-3 align-middle dark:border-gray-700">
                                                <div className="flex items-center justify-end gap-x-1">
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={category.isActive}
                                                        aria-label={t('categories.status')}
                                                        disabled={busyId === category.id}
                                                        onClick={() => toggleActive(category)}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                                                            category.isActive
                                                                ? 'bg-emerald-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                                                category.isActive
                                                                    ? 'ltr:translate-x-4 rtl:-translate-x-4'
                                                                    : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'
                                                            }`}
                                                        />
                                                    </button>
                                                    <Link href={route('categories.edit', category.id)}>
                                                        <button
                                                            type="button"
                                                            title={t('categories.edit')}
                                                            aria-label={t('categories.edit')}
                                                            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#007BFF] dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-[#00AEEF]"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(category)}
                                                        title={t('categories.delete')}
                                                        aria-label={t('categories.delete')}
                                                        className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {categories.length === 0 && (
                                <div className="py-14 text-center">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {t('categories.empty')}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        {t('categories.emptyHelp')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('categories.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('categories.deleteHelp', { code: deleting?.code })}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <SecondaryButton onClick={() => setDeleting(null)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton disabled={busyId === deleting?.id} onClick={confirmDelete}>
                            {t('common.confirm')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
