import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusPill from '@/Components/StatusPill';
import StudentAvatar from '@/Components/StudentAvatar';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaArrowLeft,
    FaCalendarDay,
    FaEdit,
    FaIdBadge,
    FaLockOpen,
    FaLock,
    FaStickyNote,
    FaTrophy,
    FaTrash,
} from 'react-icons/fa';

function Card({ title, icon, children }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                {icon}
                {title}
            </h3>
            <dl className="mt-4 space-y-3">{children}</dl>
        </section>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-x-4">
            <dt className="text-xs text-gray-600 dark:text-gray-400">{label}</dt>
            <dd className="min-w-0 break-words text-end text-sm font-medium text-gray-800 dark:text-gray-100">
                {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
            </dd>
        </div>
    );
}

export default function Show({ student }) {
    const { t, i18n } = useTranslation();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [busy, setBusy] = useState(false);

    const language = i18n.language || 'en';
    const rtl = language.startsWith('ar');

    const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium' });
    const dateTimeFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' });

    const date = (value) => (value ? dateFormat.format(new Date(value)) : null);
    const dateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : null);

    const categoryName = student.category
        ? `${rtl ? student.category.nameAr : student.category.nameFr} (${student.category.code})`
        : null;

    const toggleAccess = () => {
        setBusy(true);
        router.patch(route('students.toggleActive', student.id), {}, {
            preserveScroll: true,
            only: ['student'],
            onFinish: () => setBusy(false),
        });
    };

    const remove = () => {
        setBusy(true);
        router.delete(route('students.destroy', student.id), {
            onFinish: () => {
                setBusy(false);
                setConfirmingDelete(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex items-center gap-x-3">
                        <Link
                            href={route('students.index')}
                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title={t('students.back')}
                            aria-label={t('students.back')}
                        >
                            <FaArrowLeft className="rtl:-scale-x-100" size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                {student.name}
                            </h2>
                            <p className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                {student.studentNumber}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <button
                            type="button"
                            onClick={toggleAccess}
                            disabled={busy}
                            className="inline-flex items-center gap-x-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#007BFF] hover:text-[#007BFF] disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        >
                            {student.isActive ? <FaLock size={13} /> : <FaLockOpen size={13} />}
                            {t(student.isActive ? 'students.disableAccess' : 'students.enableAccess')}
                        </button>
                        <Link href={route('students.edit', student.id)} className="inline-flex">
                            <SecondaryButton type="button">
                                <FaEdit className="me-2" size={13} />
                                {t('students.edit')}
                            </SecondaryButton>
                        </Link>
                        <DangerButton type="button" disabled={busy} onClick={() => setConfirmingDelete(true)}>
                            <FaTrash className="me-2" size={13} />
                            {t('students.delete')}
                        </DangerButton>
                    </div>
                </div>
            }
        >
            <Head title={`${student.name} — ${student.studentNumber}`} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <StudentAvatar photoUrl={student.photoUrl} name={student.name} variant="lg" />
                        <div className="min-w-0 flex-1">
                            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2">
                                <StatusPill
                                    status={student.status}
                                    label={t(`enums.studentStatus.${student.status}`)}
                                />
                                {categoryName && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                        {categoryName}
                                    </span>
                                )}
                                <span
                                    className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        student.isActive
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                            : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                    }`}
                                >
                                    {student.isActive ? <FaLockOpen size={11} /> : <FaLock size={11} />}
                                    {t(student.isActive ? 'students.accessOpen' : 'students.accessClosed')}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {t('students.entryDate')}:{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {date(student.enrollmentDate) ?? '—'}
                                </span>
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-x-6 text-center">
                            {[
                                [student.attempts.count, t('students.attempts')],
                                [
                                    student.attempts.average === null
                                        ? '—'
                                        : `${student.attempts.average}%`,
                                    t('students.averageScore'),
                                ],
                                [student.successRecords.length, t('students.successShort')],
                            ].map(([value, label], index) => (
                                <div key={index}>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card title={t('students.identity')} icon={<FaIdBadge size={14} />}>
                            <Row label={t('common.name')} value={student.name} />
                            <Row label={t('students.cin')} value={student.cin} />
                            <Row label={t('students.birthDate')} value={date(student.birthDate)} />
                            <Row label={t('students.birthplace')} value={student.birthplace} />
                            <Row
                                label={t('students.gender')}
                                value={student.gender ? t(`enums.gender.${student.gender}`) : null}
                            />
                        </Card>

                        <Card title={t('students.registration')} icon={<FaCalendarDay size={14} />}>
                            <Row label={t('students.studentNumber')} value={student.studentNumber} />
                            <Row label={t('students.category')} value={categoryName} />
                            <Row label={t('students.entryDate')} value={date(student.enrollmentDate)} />
                            <Row label={t('students.fileStatus')} value={t(`enums.studentStatus.${student.status}`)} />
                            <Row label={t('students.phone')} value={student.phone} />
                        </Card>
                    </div>

                    <Card
                        title={t('students.account')}
                        icon={<FaLock size={14} />}
                    >
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Row label={t('students.loginCode')} value={student.hasLoginCode ? t('students.codeIssued') : t('students.noCode')} />
                            <Row label={t('common.email')} value={student.email} />
                            <Row
                                label={t('students.lastSignIn')}
                                value={dateTime(student.lastLoginAt) ?? t('students.never')}
                            />
                            <Row label={t('students.joined')} value={dateTime(student.createdAt)} />
                        </div>
                    </Card>

                    <Card title={t('students.notes')} icon={<FaStickyNote size={14} />}>
                        <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                            {student.notes || (
                                <span className="text-gray-600 dark:text-gray-400">{t('students.noNotes')}</span>
                            )}
                        </p>
                    </Card>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card title={t('students.appointments')} icon={<FaCalendarDay size={14} />}>
                            {student.appointments.length === 0 ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('students.noAppointments')}
                                </p>
                            ) : (
                                student.appointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-start justify-between gap-x-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-700"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                                {t(`enums.appointmentType.${appointment.type}`)}
                                            </p>
                                            <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                                                {dateTime(appointment.scheduledAt)}
                                                {appointment.type === 'exam' &&
                                                    (rtl ? appointment.examTitleAr : appointment.examTitleFr) &&
                                                    ` · ${rtl ? appointment.examTitleAr : appointment.examTitleFr}`}
                                            </p>
                                        </div>
                                        <StatusPill
                                            status={appointment.status === 'completed' ? 'passed' : appointment.status === 'cancelled' ? 'cancelled' : 'scheduled'}
                                            label={t(`enums.appointmentStatus.${appointment.status}`)}
                                        />
                                    </div>
                                ))
                            )}
                        </Card>

                        <Card title={t('students.successRecords')} icon={<FaTrophy size={14} />}>
                            {student.successRecords.length === 0 ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('students.noRecords')}</p>
                            ) : (
                                student.successRecords.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-start justify-between gap-x-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-700"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                                {record.type}
                                                {record.categoryCode && ` · ${record.categoryCode}`}
                                            </p>
                                            <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                                                {dateTime(record.achievedAt)}
                                            </p>
                                        </div>
                                        <StatusPill status="passed" label={t('students.recorded')} />
                                    </div>
                                ))
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            <Modal show={confirmingDelete} maxWidth="sm" onClose={() => setConfirmingDelete(false)}>
                <div className="space-y-5 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('students.deleteTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('students.deleteHelp', { name: student.name })}
                    </p>
                    <div className="flex justify-end gap-x-3">
                        <SecondaryButton onClick={() => setConfirmingDelete(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <DangerButton disabled={busy} onClick={remove}>
                            {t('common.confirm')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
