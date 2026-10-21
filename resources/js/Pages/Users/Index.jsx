import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight, FaEdit, FaSearch, FaTrash, FaUserPlus } from 'react-icons/fa';

const emptyForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
};

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

export default function Index({ users, filters, stats }) {
    const { t, i18n } = useTranslation();
    const page = usePage();
    const currentUserId = page.props.auth.user.id;
    const flash = page.props.flash;
    const errors = page.props.errors;

    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const firstRender = useRef(true);

    const form = useForm(emptyForm);

    const query = {
        search: filters.search,
        status: filters.status ?? '',
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
                only: ['users', 'filters'],
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
        setNotice({ tone: 'success', text: t(`users.flash.${flash.success}`) });
    }, [flash?.success, t]);

    useEffect(() => {
        const message = errors.users || errors.status;

        if (!message) {
            return;
        }
        setNotice({ tone: 'error', text: message });
    }, [errors.users, errors.status]);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = setTimeout(() => setNotice(null), 4000);

        return () => clearTimeout(timer);
    }, [notice]);

    const applyFilter = (changes) =>
        router.reload({
            only: ['users', 'filters'],
            data: { ...query, ...changes, page: 1 },
            preserveScroll: true,
        });

    const toggleSort = (column) =>
        applyFilter({
            sort: column,
            direction: filters.sort === column && filters.direction === 'desc' ? 'asc' : 'desc',
        });

    const openCreate = () => {
        form.reset(emptyForm);
        form.clearErrors();
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (user) => {
        form.reset({
            name: user.name,
            email: user.email ?? '',
            password: '',
            password_confirmation: '',
        });
        form.clearErrors();
        setEditing(user);
        setFormOpen(true);
    };

    const submitForm = (event) => {
        event.preventDefault();

        const done = () => setFormOpen(false);

        if (editing) {
            form.patch(route('users.update', editing.id), { onSuccess: done });
            return;
        }
        form.post(route('users.store'), { onSuccess: done });
    };

    const confirmDelete = () => {
        setBusyId(deleting.id);
        router.delete(route('users.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusyId(null);
                setDeleting(null);
            },
        });
    };

    const toggleActive = (user) => {
        setBusyId(user.id);
        router.patch(route('users.toggleActive', user.id), {}, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    };

    const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
    const dateTimeFormat = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const columns = [
        { key: 'name', label: t('common.name'), sortable: true },
        { key: 'status', label: t('users.status') },
        { key: 'last_login_at', label: t('users.lastSignIn'), sortable: true },
        { key: 'created_at', label: t('users.joined'), sortable: true },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            {t('users.title')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('users.subtitle')}</p>
                    </div>
                    <PrimaryButton type="button" onClick={openCreate}>
                        <FaUserPlus className="me-2" size={14} />
                        {t('users.create')}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={t('users.title')} />

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
                            ['total', t('users.total')],
                            ['active', t('users.active')],
                            ['inactive', t('users.inactive')],
                            ['signedIn', t('users.signedIn')],
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
                                placeholder={t('users.searchPlaceholder')}
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-11 ps-11 text-sm text-gray-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {t('users.clear')}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <Segmented
                                label={t('users.status')}
                                value={query.status}
                                onChange={(status) => applyFilter({ status })}
                                options={[
                                    { value: '', labelKey: 'users.all' },
                                    { value: 'active', labelKey: 'users.active' },
                                    { value: 'inactive', labelKey: 'users.inactive' },
                                ]}
                            />
                            <span className="ms-auto text-sm text-gray-600 dark:text-gray-300">
                                {users.total} {t('users.results')}
                            </span>
                        </div>

                        <div className="-mx-4 overflow-x-auto px-4">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-start">
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
                                            {t('users.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="group">
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle dark:border-gray-700">
                                                <div className="flex items-center gap-x-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-sm font-semibold text-white">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-x-2">
                                                            <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {user.name}
                                                            </span>
                                                            {user.id === currentUserId && (
                                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                                    {t('users.you')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={user.isActive}
                                                    disabled={busyId === user.id}
                                                    onClick={() => toggleActive(user)}
                                                    className="flex items-center gap-x-2.5 text-sm text-gray-600 transition-opacity disabled:opacity-60 dark:text-gray-300"
                                                >
                                                    <span
                                                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                                            user.isActive
                                                                ? 'bg-emerald-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                                                user.isActive
                                                                    ? 'ltr:translate-x-4 rtl:-translate-x-4'
                                                                    : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'
                                                            }`}
                                                        />
                                                    </span>
                                                    {t(`enums.userStatus.${user.isActive ? 'active' : 'inactive'}`)}
                                                </button>
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                                {user.lastLoginAt
                                                    ? dateTimeFormat.format(new Date(user.lastLoginAt))
                                                    : t('users.never')}
                                            </td>
                                            <td className="border-b border-gray-50 py-3 pe-3 align-middle text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                                {user.createdAt ? dateFormat.format(new Date(user.createdAt)) : '—'}
                                            </td>
                                            <td className="border-b border-gray-50 py-3 align-middle">
                                                <div className="flex items-center justify-end gap-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(user)}
                                                        title={t('users.edit')}
                                                        aria-label={t('users.edit')}
                                                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#007BFF] dark:hover:bg-gray-700 dark:hover:text-[#00AEEF]"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(user)}
                                                        title={t('users.delete')}
                                                        aria-label={t('users.delete')}
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

                            {users.data.length === 0 && (
                                <div className="py-14 text-center">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('users.empty')}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        {t('users.emptyHelp')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {users.last_page > 1 && (
                            <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-1">
                                {users.links.map((link, index) =>
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
                                            only={['users', 'filters']}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-[#007BFF] text-white shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                            }`}
                                        >
                                            {index === 0 ? (
                                                <FaChevronLeft className="rtl:-scale-x-100" size={12} />
                                            ) : index === users.links.length - 1 ? (
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

            <Modal show={formOpen} maxWidth="lg" onClose={() => setFormOpen(false)}>
                <form onSubmit={submitForm} className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {editing ? t('users.editTitle') : t('users.createTitle')}
                    </h3>
                    <p className="-mt-3 text-sm text-gray-600 dark:text-gray-300">
                        {editing ? t('users.editHelp') : t('users.createHelp')}
                    </p>

                    <div>
                        <InputLabel htmlFor="user-name" value={t('common.name')} />
                        <TextInput
                            id="user-name"
                            className="mt-1 block w-full"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            isFocused
                        />
                        <InputError className="mt-2" message={form.errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="user-email" value={t('common.email')} />
                        <TextInput
                            id="user-email"
                            type="email"
                            className="mt-1 block w-full"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                        <InputError className="mt-2" message={form.errors.email} />
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('users.emailHelp')}</p>
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="user-password"
                            value={editing && editing.hasPassword ? t('users.newPassword') : t('common.password')}
                        />
                        <TextInput
                            id="user-password"
                            type="password"
                            className="mt-1 block w-full"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            autoComplete="new-password"
                        />
                        <InputError className="mt-2" message={form.errors.password} />
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {editing && editing.hasPassword ? t('users.passwordKeep') : t('users.passwordHelp')}
                        </p>
                    </div>
                    <div>
                        <InputLabel htmlFor="user-password-confirmation" value={t('users.confirmPassword')} />
                        <TextInput
                            id="user-password-confirmation"
                            type="password"
                            className="mt-1 block w-full"
                            value={form.data.password_confirmation}
                            onChange={(event) => form.setData('password_confirmation', event.target.value)}
                            autoComplete="new-password"
                        />
                        <InputError className="mt-2" message={form.errors.password_confirmation} />
                    </div>

                    <div className="flex justify-end gap-x-3 pt-2">
                        <SecondaryButton onClick={() => setFormOpen(false)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('users.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('users.deleteHelp', { name: deleting?.name })}
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
