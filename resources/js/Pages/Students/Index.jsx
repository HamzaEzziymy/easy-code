import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusPill from '@/Components/StatusPill';
import StudentAvatar from '@/Components/StudentAvatar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaChevronLeft,
    FaChevronRight,
    FaEye,
    FaEdit,
    FaSearch,
    FaTrash,
    FaUserPlus,
} from 'react-icons/fa';

function Segmented({ label, value, options, onChange }) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {label}
            </span>
            <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                {options.map((option) => (
                    <button
                        key={option.value || 'all'}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                            value === option.value
                                ? 'bg-[#007BFF] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                    >
                        {t(option.labelKey)}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function Index({ students, filters, stats, categories }) {
    const { t, i18n } = useTranslation();
    const flash = usePage().props.flash;
    const errors = usePage().props.errors;

    const [search, setSearch] = useState(filters.search);
    const [deleting, setDeleting] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const firstRender = useRef(true);

    const query = {
        search: filters.search,
        status: filters.status ?? '',
        category: filters.category ?? '',
        access: filters.access ?? '',
        sort: filters.sort,
        direction: filters.direction,
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.reload({
                only: ['students', 'filters'],
                data: { ...query, search, page: 1 },
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
        setNotice({ tone: 'success', text: t(`students.flash.${flash.success}`) });
    }, [flash?.success, t]);

    useEffect(() => {
        const message = errors.students;

        if (!message) {
            return;
        }
        setNotice({ tone: 'error', text: message });
    }, [errors.students]);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = setTimeout(() => setNotice(null), 4000);

        return () => clearTimeout(timer);
    }, [notice]);

    const applyFilter = (changes) =>
        router.reload({
            only: ['students', 'filters'],
            data: { ...query, ...changes, page: 1 },
            preserveScroll: true,
        });

    const toggleSort = (column) =>
        applyFilter({
            sort: column,
            direction: filters.sort === column && filters.direction === 'desc' ? 'asc' : 'desc',
        });

    const confirmDelete = () => {
        setBusyId(deleting.id);
        router.delete(route('students.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusyId(null);
                setDeleting(null);
            },
        });
    };

    const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

    const columns = [
        { key: 'student_number', label: t('students.pupil'), sortable: true },
        { key: 'category', label: t('students.category') },
        { key: 'contact', label: t('students.contact') },
        { key: 'enrollment_date', label: t('students.entryDate'), sortable: true },
        { key: 'status', label: t('students.fileStatus'), sortable: true },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            {t('students.title')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('students.subtitle')}</p>
                    </div>
                    <Link href={route('students.create')} className="inline-flex">
                        <PrimaryButton type="button">
                            <FaUserPlus className="me-2" size={14} />
                            {t('students.create')}
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('students.title')} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {notice && (
                        <div
                            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                                notice.tone === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200'
                            }`}
                        >
                            {notice.text}
                        </div>
                    )}

                    <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ['total', t('students.title')],
                            ['active', t('students.active')],
                            ['completed', t('students.completed')],
                            ['suspended', t('students.suspended')],
                        ].map(([key, label]) => (
                            <div key={key} className="flex items-baseline gap-x-2">
                                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {stats[key]}
                                </span>
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                                <FaSearch size={14} />
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t('students.searchPlaceholder')}
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-11 ps-11 text-sm text-gray-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {t('students.clear')}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <Segmented
                                label={t('students.fileStatus')}
                                value={query.status}
                                onChange={(status) => applyFilter({ status })}
                                options={[
                                    { value: '', labelKey: 'students.all' },
                                    { value: 'active', labelKey: 'students.active' },
                                    { value: 'completed', labelKey: 'students.completed' },
                                    { value: 'suspended', labelKey: 'students.suspended' },
                                ]}
                            />
                            <Segmented
                                label={t('students.access')}
                                value={query.access}
                                onChange={(access) => applyFilter({ access })}
                                options={[
                                    { value: '', labelKey: 'students.all' },
                                    { value: 'active', labelKey: 'students.accessOpen' },
                                    { value: 'inactive', labelKey: 'students.accessClosed' },
                                ]}
                            />
                            <select
                                aria-label={t('students.category')}
                                value={query.category}
                                onChange={(event) => applyFilter({ category: event.target.value })}
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 outline-none transition focus:border-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            >
                                <option value="">{t('students.allCategories')}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.code} — {i18n.language?.startsWith('ar') ? category.nameAr : category.nameFr}
                                    </option>
                                ))}
                            </select>
                            <span className="ms-auto text-sm text-gray-600 dark:text-gray-300">
                                {students.total} {t('students.results')}
                            </span>
                        </div>

                        <div className="-mx-4 overflow-x-auto px-4">
                            <table className="w-full min-w-[880px] border-separate border-spacing-0 text-start">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th
                                                key={column.key}
                                                className="border-b border-gray-100 pb-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500"
                                            >
                                                {column.sortable ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSort(column.key)}
                                                        className={`inline-flex items-center gap-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200 ${
                                                            filters.sort === column.key
                                                                ? 'text-[#007BFF] dark:text-[#00AEEF]'
                                                                : ''
                                                        }`}
                                                    >
                                                        {column.label}
                                                        {filters.sort === column.key && (
                                                            <span aria-hidden>
                                                                {filters.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    column.label
                                                )}
                                            </th>
                                        ))}
                                        <th className="border-b border-gray-100 pb-3 text-end text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500">
                                            {t('students.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.data.map((student) => (
                                        <tr key={student.id} className="group">
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle dark:border-gray-700">
                                                <div className="flex items-center gap-x-3">
                                                    <StudentAvatar
                                                        photoUrl={student.photoUrl}
                                                        name={student.name}
                                                    />
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={route('students.show', student.id)}
                                                            className="block truncate text-sm font-semibold text-gray-900 hover:text-[#007BFF] dark:text-gray-100 dark:hover:text-[#00AEEF]"
                                                        >
                                                            {student.name}
                                                        </Link>
                                                        <p className="truncate font-mono text-xs text-gray-600 dark:text-gray-300">
                                                            {student.studentNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                                {student.category ? (
                                                    <span className="inline-flex items-center gap-x-2">
                                                        <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                                            {student.category.code}
                                                        </span>
                                                        <span className="truncate">
                                                            {i18n.language?.startsWith('ar')
                                                                ? student.category.nameAr
                                                                : student.category.nameFr}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                                <div className="flex flex-col gap-y-0.5">
                                                    <span className="font-mono text-xs" dir="ltr">
                                                        {student.phone || '—'}
                                                    </span>
                                                    <span className="truncate text-xs text-gray-600 dark:text-gray-400">
                                                        {student.cin ? `CIN ${student.cin}` : t('students.noCin')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                                {student.enrollmentDate
                                                    ? dateFormat.format(new Date(student.enrollmentDate))
                                                    : '—'}
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle dark:border-gray-700">
                                                <div className="flex flex-wrap items-center gap-x-2">
                                                    <StatusPill
                                                        status={student.status}
                                                        label={t(`enums.studentStatus.${student.status}`)}
                                                    />
                                                    {!student.isActive && (
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {t('students.accessClosed')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border-b border-gray-50 py-3 align-middle">
                                                <div className="flex items-center justify-end gap-x-1">
                                                    <Link
                                                        href={route('students.show', student.id)}
                                                        title={t('students.view')}
                                                        aria-label={t('students.view')}
                                                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-[#007BFF]/10 hover:text-[#007BFF] dark:hover:bg-[#00AEEF]/10 dark:hover:text-[#00AEEF]"
                                                    >
                                                        <FaEye size={14} />
                                                    </Link>
                                                    <Link
                                                        href={route('students.edit', student.id)}
                                                        title={t('students.edit')}
                                                        aria-label={t('students.edit')}
                                                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#007BFF] dark:hover:bg-gray-700 dark:hover:text-[#00AEEF]"
                                                    >
                                                        <FaEdit size={14} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(student)}
                                                        title={t('students.delete')}
                                                        aria-label={t('students.delete')}
                                                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {students.data.length === 0 && (
                                <div className="py-14 text-center">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('students.empty')}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        {t('students.emptyHelp')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {students.last_page > 1 && (
                            <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-1">
                                {students.links.map((link, index) =>
                                    link.url === null ? (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="px-3 py-1.5 text-sm text-gray-300 dark:text-gray-600"
                                        >
                                            {index === 0 ? (
                                                <FaChevronLeft className="rtl:-scale-x-100" size={12} />
                                            ) : (
                                                <FaChevronRight className="rtl:-scale-x-100" size={12} />
                                            )}
                                        </span>
                                    ) : (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            only={['students', 'filters']}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-[#007BFF] text-white shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                            }`}
                                        >
                                            {index === 0 ? (
                                                <FaChevronLeft className="rtl:-scale-x-100" size={12} />
                                            ) : index === students.links.length - 1 ? (
                                                <FaChevronRight className="rtl:-scale-x-100" size={12} />
                                            ) : (
                                                link.label
                                            )}
                                        </Link>
                                    )
                                )}
                            </nav>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('students.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('students.deleteHelp', { name: deleting?.name })}
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
