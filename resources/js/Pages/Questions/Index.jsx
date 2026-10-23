import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import QuestionPreview from '@/Components/QuestionPreview';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusPill from '@/Components/StatusPill';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaEye, FaSearch } from 'react-icons/fa';
import {
    FaChevronLeft,
    FaChevronRight,
    FaCircleQuestion,
    FaImage,
    FaPlus,
    FaTrash,
    FaVolumeHigh,
} from 'react-icons/fa6';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';
const cell = 'border-b border-gray-100 py-4 pe-4 align-middle dark:border-gray-700';

/** Staff write in whichever language they have to hand, so a column falls back to the other one. */
const inLanguage = (rtl, arabic, french) => (rtl ? arabic || french : french || arabic);
const otherLanguage = (rtl, arabic, french) => (rtl ? french : arabic);

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

export default function Index({ questions, filters, stats, categories }) {
    const { t, i18n } = useTranslation();
    const flash = usePage().props.flash;
    const errors = usePage().props.errors;
    const rtl = i18n.language?.startsWith('ar');

    const [search, setSearch] = useState(filters.search);
    const [deleting, setDeleting] = useState(null);
    const [preview, setPreview] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const firstRender = useRef(true);

    const query = {
        search: filters.search,
        category: filters.category ?? '',
        answer: filters.answer ?? '',
        status: filters.status ?? '',
        media: filters.media ?? '',
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
                only: ['questions', 'filters'],
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
        setNotice({ tone: 'success', text: t(`questions.flash.${flash.success}`) });
    }, [flash?.success, t]);

    useEffect(() => {
        const message = errors.questions;

        if (!message) {
            return;
        }
        setNotice({ tone: 'error', text: message });
    }, [errors.questions]);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = setTimeout(() => setNotice(null), 4000);

        return () => clearTimeout(timer);
    }, [notice]);

    const applyFilter = (changes) =>
        router.reload({
            only: ['questions', 'filters'],
            data: { ...query, ...changes, page: 1 },
            preserveScroll: true,
        });

    const toggleSort = (column) =>
        applyFilter({
            sort: column,
            direction: filters.sort === column && filters.direction === 'desc' ? 'asc' : 'desc',
        });

    const toggleActive = (question) => {
        setBusyId(question.id);
        router.patch(route('questions.toggleActive', question.id), {}, {
            preserveScroll: true,
            only: ['questions', 'stats'],
            onFinish: () => setBusyId(null),
        });
    };

    const confirmDelete = () => {
        setBusyId(deleting.id);
        router.delete(route('questions.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusyId(null);
                setDeleting(null);
            },
        });
    };

    const sortable = [
        { key: 'created_at', label: t('questions.added') },
        { key: 'time_limit_seconds', label: t('questions.time') },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            {t('questions.title')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('questions.subtitle')}</p>
                    </div>
                    <Link href={route('questions.create')} className="inline-flex">
                        <PrimaryButton type="button">
                            <FaPlus className="me-2" size={12} />
                            {t('questions.create')}
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('questions.title')} />

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

                    <div className={`grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 ${panel}`}>
                        {[
                            ['total', t('questions.title')],
                            ['active', t('questions.active')],
                            ['recorded', t('questions.withAudio')],
                            ['uncategorised', t('questions.noCategory')],
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

                    <div className={`${panel} space-y-4 p-4`}>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                                <FaSearch size={14} />
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t('questions.searchPlaceholder')}
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pe-11 ps-11 text-sm text-gray-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {t('questions.clear')}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <Segmented
                                label={t('questions.answer')}
                                value={query.answer}
                                onChange={(answer) => applyFilter({ answer })}
                                options={[
                                    { value: '', labelKey: 'questions.all' },
                                    { value: 'single', labelKey: 'questions.single' },
                                    { value: 'multiple', labelKey: 'questions.multiple' },
                                ]}
                            />
                            <Segmented
                                label={t('questions.status')}
                                value={query.status}
                                onChange={(status) => applyFilter({ status })}
                                options={[
                                    { value: '', labelKey: 'questions.all' },
                                    { value: 'active', labelKey: 'questions.active' },
                                    { value: 'inactive', labelKey: 'questions.inactive' },
                                ]}
                            />
                            <Segmented
                                label={t('questions.media')}
                                value={query.media}
                                onChange={(media) => applyFilter({ media })}
                                options={[
                                    { value: '', labelKey: 'questions.all' },
                                    { value: 'image', labelKey: 'questions.withImage' },
                                    { value: 'audio', labelKey: 'questions.withAudio' },
                                    { value: 'none', labelKey: 'questions.withoutMedia' },
                                ]}
                            />
                            <select
                                aria-label={t('questions.category')}
                                value={query.category}
                                onChange={(event) => applyFilter({ category: event.target.value })}
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="">{t('questions.anyCategory')}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.code} —{' '}
                                        {rtl ? category.nameAr || category.nameFr : category.nameFr}
                                    </option>
                                ))}
                                <option value="none">{t('questions.noCategory')}</option>
                            </select>
                        </div>
                    </div>

                    <div className={`${panel} overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1240px] text-start text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-start dark:bg-gray-900/40">
                                        <th className={`${cell} ps-4 text-start`}>{t('questions.question')}</th>
                                        <th className={`${cell} text-start`}>{t('questions.category')}</th>
                                        <th className={`${cell} text-start`}>{t('questions.choices')}</th>
                                        <th className={`${cell} text-start`}>{t('questions.time')}</th>
                                        <th className={`${cell} text-start`}>{t('questions.media')}</th>
                                        <th className={`${cell} text-start`}>{t('questions.status')}</th>
                                        <th className={`${cell} pe-4 text-end`}>{t('questions.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.data.map((question) => {
                                        const primary = inLanguage(
                                            rtl,
                                            question.textAr,
                                            question.textFr,
                                        );
                                        const secondary = otherLanguage(
                                            rtl,
                                            question.textAr,
                                            question.textFr,
                                        );
                                        const images = [question.media.imageAr, question.media.imageFr].filter(
                                            Boolean,
                                        ).length;
                                        const audios = [question.media.audioAr, question.media.audioFr].filter(
                                            Boolean,
                                        ).length;

                                        return (
                                            <tr
                                                key={question.id}
                                                className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                                            >
                                                <td className={`${cell} ps-4`}>
                                                    <Link
                                                        href={route('questions.edit', question.id)}
                                                        className="block max-w-md"
                                                    >
                                                        <span
                                                            dir={rtl ? 'rtl' : 'ltr'}
                                                            className="line-clamp-2 font-semibold text-gray-900 dark:text-gray-100"
                                                        >
                                                            {primary}
                                                        </span>
                                                        {secondary && (
                                                            <span
                                                                dir={rtl ? 'ltr' : 'rtl'}
                                                                className="mt-0.5 block truncate text-xs text-gray-600 dark:text-gray-400"
                                                            >
                                                                {secondary}
                                                            </span>
                                                        )}
                                                    </Link>
                                                    <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                                                        #{question.id} · {question.createdAt}
                                                    </span>
                                                </td>
                                                <td className={cell}>
                                                    {question.categoryCode ? (
                                                        <div className="flex items-center gap-x-2">
                                                            <span
                                                                dir="ltr"
                                                                className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                                            >
                                                                {question.categoryCode}
                                                            </span>
                                                            <span
                                                                dir={rtl ? 'rtl' : 'ltr'}
                                                                className="truncate text-gray-700 dark:text-gray-300"
                                                            >
                                                                {inLanguage(
                                                                    rtl,
                                                                    question.categoryAr,
                                                                    question.categoryFr,
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            {t('questions.noCategory')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={cell}>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {question.choices.map((choice) => (
                                                            <span
                                                                key={choice.key}
                                                                dir="ltr"
                                                                title={inLanguage(rtl, choice.ar, choice.fr)}
                                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                                                    choice.correct
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}
                                                            >
                                                                {choice.key}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                                                        {question.multiple
                                                            ? t('questions.multiple')
                                                            : t('questions.single')}
                                                    </span>
                                                </td>
                                                <td className={cell}>
                                                    <span dir="ltr" className="font-mono tabular-nums">
                                                        {question.timeSeconds ?? '—'}
                                                        <span className="ms-0.5 text-xs text-gray-500">
                                                            {t('questions.seconds')}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className={cell}>
                                                    <div className="flex items-center gap-x-3 text-gray-500 dark:text-gray-400">
                                                        {images > 0 ? (
                                                            <span className="inline-flex items-center gap-x-1">
                                                                <FaImage size={13} />
                                                                <span className="text-xs font-semibold tabular-nums">
                                                                    {images}
                                                                </span>
                                                            </span>
                                                        ) : null}
                                                        {audios > 0 ? (
                                                            <span className="inline-flex items-center gap-x-1">
                                                                <FaVolumeHigh size={13} />
                                                                <span className="text-xs font-semibold tabular-nums">
                                                                    {audios}
                                                                </span>
                                                            </span>
                                                        ) : null}
                                                        {images === 0 && audios === 0 && (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={cell}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(question)}
                                                        disabled={busyId === question.id}
                                                        title={
                                                            question.isActive
                                                                ? t('questions.deactivateHelp')
                                                                : t('questions.activateHelp')
                                                        }
                                                        className="disabled:opacity-50"
                                                    >
                                                        <StatusPill
                                                            status={question.isActive ? 'active' : 'cancelled'}
                                                            label={
                                                                question.isActive
                                                                    ? t('questions.active')
                                                                    : t('questions.inactive')
                                                            }
                                                        />
                                                    </button>
                                                    {question.examsCount > 0 && (
                                                        <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                                                            {t('questions.usedIn', {
                                                                count: question.examsCount,
                                                            })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`${cell} pe-4`}>
                                                    <div className="flex items-center justify-end gap-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreview(question)}
                                                            title={t('questions.preview')}
                                                            aria-label={t('questions.preview')}
                                                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-[#007BFF] dark:hover:bg-blue-500/10 dark:hover:text-[#7EB8F5]"
                                                        >
                                                            <FaEye size={14} />
                                                        </button>
                                                        <Link
                                                            href={route('questions.edit', question.id)}
                                                            title={t('questions.edit')}
                                                            aria-label={t('questions.edit')}
                                                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                        >
                                                            <FaEdit size={14} />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleting(question)}
                                                            title={t('questions.delete')}
                                                            aria-label={t('questions.delete')}
                                                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {questions.data.length === 0 && (
                                <div className="py-14 text-center">
                                    <FaCircleQuestion
                                        size={26}
                                        className="mx-auto text-gray-300 dark:text-gray-600"
                                    />
                                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('questions.empty')}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        {t('questions.emptyHelp')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {questions.last_page > 1 && (
                            <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-1">
                                {questions.links.map((link, index) =>
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
                                            only={['questions', 'filters']}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-[#007BFF] text-white shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                            }`}
                                        >
                                            {index === 0 ? (
                                                <FaChevronLeft className="rtl:-scale-x-100" size={12} />
                                            ) : index === questions.links.length - 1 ? (
                                                <FaChevronRight className="rtl:-scale-x-100" size={12} />
                                            ) : (
                                                link.label
                                            )}
                                        </Link>
                                    ),
                                )}
                            </nav>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1">
                        {sortable.map((column) => (
                            <button
                                key={column.key}
                                type="button"
                                onClick={() => toggleSort(column.key)}
                                className={`text-xs font-medium uppercase tracking-wide transition-colors ${
                                    filters.sort === column.key
                                        ? 'text-[#007BFF] dark:text-[#00AEEF]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}
                            >
                                {column.label}
                                <span className="ms-1">{filters.direction === 'asc' ? '↑' : '↓'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Modal show={deleting !== null} maxWidth="sm" onClose={() => setDeleting(null)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('questions.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('questions.deleteHelp', { id: deleting?.id })}
                    </p>
                    <p dir={rtl ? 'rtl' : 'ltr'} className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {inLanguage(rtl, deleting?.textAr, deleting?.textFr)}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <SecondaryButton onClick={() => setDeleting(null)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton disabled={busyId === deleting?.id} onClick={confirmDelete}>
                            {t('common.confirm')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <QuestionPreview question={preview} onClose={() => setPreview(null)} />
        </AuthenticatedLayout>
    );
}
