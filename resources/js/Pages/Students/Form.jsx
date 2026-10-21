import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StudentAvatar from '@/Components/StudentAvatar';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCamera, FaTrash } from 'react-icons/fa';

const fieldClass =
    'mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-[#007BFF] focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

function Section({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{description}</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({ label, htmlFor, hint, error, className = '', children }) {
    return (
        <div className={className}>
            <InputLabel htmlFor={htmlFor} value={label} />
            {children}
            <InputError className="mt-2" message={error} />
            {hint && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}</p>}
        </div>
    );
}

export default function Form({ student, categories, suggestedNumber }) {
    const { t, i18n } = useTranslation();
    const isEdit = student !== null;

    const [photoPreview, setPhotoPreview] = useState(student?.photoUrl ?? null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const empty = {
        name: '',
        email: '',
        login_code: '',
        student_number: suggestedNumber ?? '',
        license_category_id: categories[0]?.id ?? '',
        enrollment_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        phone: '',
        cin: '',
        birth_date: '',
        birthplace: '',
        gender: '',
        notes: '',
    };

    const form = useForm({
        ...(isEdit
            ? {
                  name: student.name ?? '',
                  email: student.email ?? '',
                  login_code: '',
                  student_number: student.studentNumber ?? '',
                  license_category_id: student.licenseCategoryId ?? categories[0]?.id ?? '',
                  enrollment_date: student.enrollmentDate ?? '',
                  status: student.status ?? 'active',
                  phone: student.phone ?? '',
                  cin: student.cin ?? '',
                  birth_date: student.birthDate ?? '',
                  birthplace: student.birthplace ?? '',
                  gender: student.gender ?? '',
                  notes: student.notes ?? '',
              }
            : empty),
        photo: null,
        remove_photo: false,
    });

    const title = useMemo(
        () => (isEdit ? t('students.editTitle') : t('students.createTitle')),
        [isEdit, t]
    );

    const pickPhoto = (event) => {
        const file = event.target.files?.[0] ?? null;

        form.setData('photo', file);
        form.setData('remove_photo', false);
        setRemovePhoto(false);

        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
            return;
        }
        setPhotoPreview(isEdit ? student.photoUrl : null);
    };

    const clearPhoto = () => {
        setRemovePhoto(true);
        setPhotoPreview(null);
        form.setData('photo', null);
        form.setData('remove_photo', true);
    };

    const submit = (event) => {
        event.preventDefault();

        const options = { forceFormData: true };

        // PHP only reads a multipart body on POST, so the PATCH has to be spoofed.
        form.transform((data) => (isEdit ? { ...data, _method: 'patch' } : data));

        form.post(isEdit ? route('students.update', student.id) : route('students.store'), options);
    };

    const categoryLabel = (category) =>
        `${category.code} — ${i18n.language?.startsWith('ar') ? category.nameAr : category.nameFr}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex items-center gap-x-3">
                        <Link
                            href={isEdit ? route('students.show', student.id) : route('students.index')}
                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title={t('students.back')}
                            aria-label={t('students.back')}
                        >
                            <FaArrowLeft className="rtl:-scale-x-100" size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                {title}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {isEdit ? t('students.editHelp') : t('students.createHelp')}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={title} />

            <form onSubmit={submit} className="py-8">
                <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {categories.length === 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">
                            {t('students.noCategories')}{' '}
                            <Link
                                href={route('categories.index')}
                                className="font-semibold underline underline-offset-2"
                            >
                                {t('students.manageCategories')}
                            </Link>
                        </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
                        <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex justify-center">
                                <StudentAvatar
                                    photoUrl={photoPreview}
                                    name={form.data.name}
                                    variant="lg"
                                />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {t('students.photo')}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {t('students.photoHelp')}
                            </p>

                            <label className="mt-4 inline-flex cursor-pointer items-center gap-x-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                <FaCamera size={14} />
                                {photoPreview ? t('students.changePhoto') : t('students.choosePhoto')}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={pickPhoto}
                                />
                            </label>

                            {(photoPreview || isEdit) && (
                                <button
                                    type="button"
                                    onClick={clearPhoto}
                                    disabled={!photoPreview}
                                    className="mt-2 inline-flex items-center gap-x-2 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-red-600 disabled:opacity-40 dark:text-gray-500"
                                >
                                    <FaTrash size={12} />
                                    {t('students.removePhoto')}
                                </button>
                            )}

                            <InputError className="mt-2" message={form.errors.photo} />

                            <div className="mt-5 border-t border-gray-100 pt-4 text-start dark:border-gray-700">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                    {t('students.loginCode')}
                                </p>
                                <TextInput
                                    id="student-login-code"
                                    className={fieldClass}
                                    value={form.data.login_code}
                                    onChange={(event) => form.setData('login_code', event.target.value)}
                                    placeholder={isEdit ? '' : 'EC-2026-0002'}
                                    autoComplete="off"
                                />
                                <InputError className="mt-2" message={form.errors.login_code} />
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {isEdit ? t('students.loginCodeKeep') : t('students.loginCodeHelp')}
                                </p>

                                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                    {t('students.emailOptional')}
                                </p>
                                <TextInput
                                    id="student-email"
                                    type="email"
                                    className={fieldClass}
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                />
                                <InputError className="mt-2" message={form.errors.email} />
                            </div>
                        </section>

                        <div className="space-y-5">
                            <Section title={t('students.identity')} description={t('students.identityHelp')}>
                                <Field label={t('common.name')} htmlFor="student-name" error={form.errors.name} className="sm:col-span-2">
                                    <TextInput
                                        id="student-name"
                                        className={fieldClass}
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        isFocused
                                    />
                                </Field>

                                <Field label={t('students.cin')} htmlFor="student-cin" error={form.errors.cin} hint={t('students.cinHelp')}>
                                    <TextInput
                                        id="student-cin"
                                        className={`${fieldClass} font-mono`}
                                        value={form.data.cin}
                                        onChange={(event) => form.setData('cin', event.target.value)}
                                    />
                                </Field>

                                <Field label={t('students.gender')} htmlFor="student-gender" error={form.errors.gender}>
                                    <select
                                        id="student-gender"
                                        className={fieldClass}
                                        value={form.data.gender}
                                        onChange={(event) => form.setData('gender', event.target.value)}
                                    >
                                        <option value="">{t('students.notSpecified')}</option>
                                        <option value="male">{t('enums.gender.male')}</option>
                                        <option value="female">{t('enums.gender.female')}</option>
                                    </select>
                                </Field>

                                <Field label={t('students.birthDate')} htmlFor="student-birth-date" error={form.errors.birth_date}>
                                    <input
                                        id="student-birth-date"
                                        type="date"
                                        className={fieldClass}
                                        value={form.data.birth_date}
                                        onChange={(event) => form.setData('birth_date', event.target.value)}
                                    />
                                </Field>

                                <Field label={t('students.birthplace')} htmlFor="student-birthplace" error={form.errors.birthplace}>
                                    <TextInput
                                        id="student-birthplace"
                                        className={fieldClass}
                                        value={form.data.birthplace}
                                        onChange={(event) => form.setData('birthplace', event.target.value)}
                                    />
                                </Field>
                            </Section>

                            <Section title={t('students.registration')} description={t('students.registrationHelp')}>
                                <Field label={t('students.studentNumber')} htmlFor="student-number" error={form.errors.student_number}>
                                    <TextInput
                                        id="student-number"
                                        className={`${fieldClass} font-mono`}
                                        value={form.data.student_number}
                                        onChange={(event) => form.setData('student_number', event.target.value)}
                                    />
                                </Field>

                                <Field label={t('students.category')} htmlFor="student-category" error={form.errors.license_category_id}>
                                    <select
                                        id="student-category"
                                        className={fieldClass}
                                        value={form.data.license_category_id}
                                        onChange={(event) => form.setData('license_category_id', event.target.value)}
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {categoryLabel(category)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={t('students.entryDate')} htmlFor="student-entry" error={form.errors.enrollment_date} hint={t('students.entryDateHelp')}>
                                    <input
                                        id="student-entry"
                                        type="date"
                                        className={fieldClass}
                                        value={form.data.enrollment_date}
                                        onChange={(event) => form.setData('enrollment_date', event.target.value)}
                                    />
                                </Field>

                                <Field label={t('students.fileStatus')} htmlFor="student-status" error={form.errors.status}>
                                    <select
                                        id="student-status"
                                        className={fieldClass}
                                        value={form.data.status}
                                        onChange={(event) => form.setData('status', event.target.value)}
                                    >
                                        {['active', 'completed', 'suspended'].map((status) => (
                                            <option key={status} value={status}>
                                                {t(`enums.studentStatus.${status}`)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={t('students.phone')} htmlFor="student-phone" error={form.errors.phone}>
                                    <TextInput
                                        id="student-phone"
                                        type="tel"
                                        dir="ltr"
                                        className={`${fieldClass} font-mono`}
                                        value={form.data.phone}
                                        onChange={(event) => form.setData('phone', event.target.value)}
                                    />
                                </Field>
                            </Section>

                            <Section title={t('students.notes')}>
                                <div className="sm:col-span-2">
                                    <textarea
                                        id="student-notes"
                                        rows={4}
                                        className={fieldClass}
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                        placeholder={t('students.notesHelp')}
                                    />
                                    <InputError className="mt-2" message={form.errors.notes} />
                                </div>
                            </Section>

                            <div className="flex items-center justify-end gap-x-3 pt-1">
                                <Link
                                    href={isEdit ? route('students.show', student.id) : route('students.index')}
                                    className="inline-flex"
                                >
                                    <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                                </Link>
                                <PrimaryButton type="submit" disabled={form.processing || categories.length === 0}>
                                    {t('common.save')}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
