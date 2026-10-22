import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CodeCopy from '@/Components/CodeCopy';
import DigitSquares from '@/Components/DigitSquares';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StudentAvatar from '@/Components/StudentAvatar';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaArrowLeft,
    FaCamera,
    FaEnvelope,
    FaFolderOpen,
    FaIdBadge,
    FaKey,
    FaStickyNote,
    FaTrash
} from 'react-icons/fa';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500';

function Input({ className = '', ...props }) {
    return <input {...props} className={`${fieldClass} ${className}`} />;
}

function Section({ title, description, icon, columns = 2, children }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                <span className="text-[#007BFF] dark:text-[#00AEEF]">{icon}</span>
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{description}</p>
            )}

            <div className={`mt-4 grid gap-4 ${columns === 1 ? '' : 'sm:grid-cols-2'}`}>
                {children}
            </div>
        </section>
    );
}

function Field({ label, htmlFor, hint, error, required, children }) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
                {label}
                {required && (
                    <span className="ms-1 text-[#FF9800]" aria-hidden>
                        *
                    </span>
                )}
            </label>
            {children}
            <InputError className="mt-1.5" message={error} />
            {hint && <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">{hint}</p>}
        </div>
    );
}

export default function Form({ student, categories, suggestedNumber }) {
    const { t, i18n } = useTranslation();
    const isEdit = student !== null;

    const [photoPreview, setPhotoPreview] = useState(student?.photoUrl ?? null);

    const form = useForm(
        isEdit
            ? {
                  first_name: student.firstName ?? '',
                  last_name: student.lastName ?? '',
                  first_name_ar: student.firstNameAr ?? '',
                  last_name_ar: student.lastNameAr ?? '',
                  email: student.email ?? '',
                  phone: student.phone ?? '',
                  login_code: '',
                  student_number: student.studentNumber ?? '',
                  lessons_total: String(student.lessonsTotal ?? ''),
                  license_category_id: student.licenseCategoryId ?? '',
                  enrollment_date: student.enrollmentDate ?? '',
                  status: student.status ?? 'active',
                  gender: student.gender ?? '',
                  cin: student.cin ?? '',
                  birth_date: student.birthDate ?? '',
                  birthplace: student.birthplace ?? '',
                  notes: student.notes ?? '',
                  photo: null,
                  remove_photo: false
              }
            : {
                  first_name: '',
                  last_name: '',
                  first_name_ar: '',
                  last_name_ar: '',
                  email: '',
                  phone: '',
                  login_code: '',
                  student_number: suggestedNumber ?? '',
                  lessons_total: '',
                  license_category_id: categories[0]?.id ?? '',
                  enrollment_date: new Date().toISOString().slice(0, 10),
                  status: 'active',
                  gender: '',
                  cin: '',
                  birth_date: '',
                  birthplace: '',
                  notes: '',
                  photo: null,
                  remove_photo: false
              }
    );

    const title = useMemo(
        () => (isEdit ? t('students.editTitle') : t('students.createTitle')),
        [isEdit, t]
    );

    const fullName = `${form.data.first_name} ${form.data.last_name}`.trim();

    const pickPhoto = (event) => {
        const file = event.target.files?.[0] ?? null;

        form.setData('photo', file);
        form.setData('remove_photo', false);

        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
            return;
        }
        setPhotoPreview(isEdit ? student.photoUrl : null);
    };

    const clearPhoto = () => {
        setPhotoPreview(null);
        form.setData('photo', null);
        form.setData('remove_photo', true);
    };

    const submit = (event) => {
        event.preventDefault();

        // PHP only reads a multipart body on POST, so the PATCH has to be spoofed.
        form.transform((data) => (isEdit ? { ...data, _method: 'patch' } : data));

        form.post(isEdit ? route('students.update', student.id) : route('students.store'), {
            forceFormData: true
        });
    };

    const categoryLabel = (category) =>
        `${category.code} — ${i18n.language?.startsWith('ar') ? category.nameAr : category.nameFr}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex items-center gap-x-3">
                        <Link
                            href={
                                isEdit
                                    ? route('students.show', student.id)
                                    : route('students.index')
                            }
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
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="me-1 text-[#FF9800]">*</span>
                        {t('students.requiredLegend')}
                    </p>
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

                    <div className="grid items-start gap-5 lg:grid-cols-[19rem_1fr]">
                        <div className="space-y-5 lg:sticky lg:top-24">
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-center">
                                    <StudentAvatar
                                        photoUrl={photoPreview}
                                        name={fullName}
                                        variant="lg"
                                    />
                                </div>
                                <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {fullName || t('students.photo')}
                                </p>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {t('students.photoHelp')}
                                </p>

                                <label className="mt-4 inline-flex cursor-pointer items-center gap-x-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                    <FaCamera size={14} />
                                    {photoPreview
                                        ? t('students.changePhoto')
                                        : t('students.choosePhoto')}
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
                            </section>

                            <Section
                                title={t('students.contact')}
                                description={t('students.contactHelp')}
                                icon={<FaEnvelope size={14} />}
                                columns={1}
                            >
                                <Field
                                    label={t('students.emailOptional')}
                                    htmlFor="student-email"
                                    error={form.errors.email}
                                >
                                    <Input
                                        id="student-email"
                                        type="email"
                                        autoComplete="off"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData('email', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.phone')}
                                    htmlFor="student-phone"
                                    hint={t('students.phoneHelp')}
                                    error={form.errors.phone}
                                >
                                    <Input
                                        id="student-phone"
                                        type="tel"
                                        dir="ltr"
                                        className="font-mono"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            form.setData('phone', event.target.value)
                                        }
                                    />
                                </Field>

                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                                    <p className="flex items-center gap-x-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        <FaKey
                                            size={12}
                                            className="text-[#007BFF] dark:text-[#00AEEF]"
                                        />
                                        {t('students.loginCode')}
                                    </p>

                                    <Input
                                        id="student-login-code"
                                        autoComplete="off"
                                        dir="ltr"
                                        placeholder={isEdit ? '' : 'EC-2026-0002'}
                                        value={form.data.login_code}
                                        onChange={(event) =>
                                            form.setData('login_code', event.target.value)
                                        }
                                    />
                                    <InputError
                                        className="mt-1.5"
                                        message={form.errors.login_code}
                                    />

                                    {isEdit && student.loginCode ? (
                                        <div className="mt-3 space-y-1.5">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {t('students.currentLoginCode')}
                                            </p>
                                            <CodeCopy
                                                code={student.loginCode}
                                                className="w-full justify-between"
                                            />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {t('students.loginCodeKeep')}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                                            {isEdit
                                                ? t('students.codeNotStored')
                                                : t('students.loginCodeHelp')}
                                        </p>
                                    )}
                                </div>
                            </Section>
                        </div>

                        <div className="space-y-5">
                            <Section
                                title={t('students.identity')}
                                description={t('students.identityHelp')}
                                icon={<FaIdBadge size={14} />}
                            >
                                <Field
                                    label={t('students.firstName')}
                                    htmlFor="student-first-name"
                                    required
                                    error={form.errors.first_name}
                                >
                                    <Input
                                        id="student-first-name"
                                        autoFocus
                                        value={form.data.first_name}
                                        onChange={(event) =>
                                            form.setData('first_name', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.lastName')}
                                    htmlFor="student-last-name"
                                    required
                                    error={form.errors.last_name}
                                >
                                    <Input
                                        id="student-last-name"
                                        value={form.data.last_name}
                                        onChange={(event) =>
                                            form.setData('last_name', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.firstNameAr')}
                                    htmlFor="student-first-name-ar"
                                    error={form.errors.first_name_ar}
                                >
                                    <Input
                                        id="student-first-name-ar"
                                        dir="rtl"
                                        value={form.data.first_name_ar}
                                        onChange={(event) =>
                                            form.setData('first_name_ar', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.lastNameAr')}
                                    htmlFor="student-last-name-ar"
                                    error={form.errors.last_name_ar}
                                >
                                    <Input
                                        id="student-last-name-ar"
                                        dir="rtl"
                                        value={form.data.last_name_ar}
                                        onChange={(event) =>
                                            form.setData('last_name_ar', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.gender')}
                                    htmlFor="student-gender"
                                    required
                                    error={form.errors.gender}
                                >
                                    <select
                                        id="student-gender"
                                        className={fieldClass}
                                        value={form.data.gender}
                                        onChange={(event) =>
                                            form.setData('gender', event.target.value)
                                        }
                                    >
                                        <option value="" disabled>
                                            {t('students.chooseGender')}
                                        </option>
                                        {['male', 'female'].map((gender) => (
                                            <option key={gender} value={gender}>
                                                {t(`enums.gender.${gender}`)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t('students.cin')}
                                    htmlFor="student-cin"
                                    required
                                    hint={t('students.cinHelp')}
                                    error={form.errors.cin}
                                >
                                    <Input
                                        id="student-cin"
                                        className="font-mono"
                                        value={form.data.cin}
                                        onChange={(event) =>
                                            form.setData('cin', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.birthDate')}
                                    htmlFor="student-birth-date"
                                    error={form.errors.birth_date}
                                >
                                    <Input
                                        id="student-birth-date"
                                        type="date"
                                        value={form.data.birth_date}
                                        onChange={(event) =>
                                            form.setData('birth_date', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.birthplace')}
                                    htmlFor="student-birthplace"
                                    error={form.errors.birthplace}
                                >
                                    <Input
                                        id="student-birthplace"
                                        value={form.data.birthplace}
                                        onChange={(event) =>
                                            form.setData('birthplace', event.target.value)
                                        }
                                    />
                                </Field>
                            </Section>

                            <Section
                                title={t('students.registration')}
                                description={t('students.registrationHelp')}
                                icon={<FaFolderOpen size={14} />}
                            >
                                <Field
                                    label={t('students.studentNumber')}
                                    htmlFor="student-number"
                                    required
                                    error={form.errors.student_number}
                                >
                                    <Input
                                        id="student-number"
                                        className="font-mono"
                                        value={form.data.student_number}
                                        onChange={(event) =>
                                            form.setData('student_number', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.category')}
                                    htmlFor="student-category"
                                    required
                                    error={form.errors.license_category_id}
                                >
                                    <select
                                        id="student-category"
                                        className={fieldClass}
                                        value={form.data.license_category_id}
                                        onChange={(event) =>
                                            form.setData('license_category_id', event.target.value)
                                        }
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {categoryLabel(category)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t('students.entryDate')}
                                    htmlFor="student-entry"
                                    required
                                    hint={t('students.entryDateHelp')}
                                    error={form.errors.enrollment_date}
                                >
                                    <Input
                                        id="student-entry"
                                        type="date"
                                        value={form.data.enrollment_date}
                                        onChange={(event) =>
                                            form.setData('enrollment_date', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label={t('students.fileStatus')}
                                    htmlFor="student-status"
                                    required
                                    error={form.errors.status}
                                >
                                    <select
                                        id="student-status"
                                        className={fieldClass}
                                        value={form.data.status}
                                        onChange={(event) =>
                                            form.setData('status', event.target.value)
                                        }
                                    >
                                        {['active', 'completed', 'suspended'].map((status) => (
                                            <option key={status} value={status}>
                                                {t(`enums.studentStatus.${status}`)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t('students.lessonsCount')}
                                    htmlFor="lessons-total-0"
                                    hint={t('students.lessonsCountHelp')}
                                    error={form.errors.lessons_total}
                                >
                                    <DigitSquares
                                        value={form.data.lessons_total}
                                        onChange={(value) => form.setData('lessons_total', value)}
                                        idPrefix="lessons-total"
                                        label={t('students.lessonsCount')}
                                    />
                                </Field>
                            </Section>

                            <Section
                                title={t('students.notes')}
                                icon={<FaStickyNote size={14} />}
                                columns={1}
                            >
                                <div>
                                    <textarea
                                        id="student-notes"
                                        rows={4}
                                        className={fieldClass}
                                        value={form.data.notes}
                                        onChange={(event) =>
                                            form.setData('notes', event.target.value)
                                        }
                                        placeholder={t('students.notesHelp')}
                                    />
                                    <InputError className="mt-1.5" message={form.errors.notes} />
                                </div>
                            </Section>

                            <div className="flex items-center justify-end gap-x-3 pt-1">
                                <Link
                                    href={
                                        isEdit
                                            ? route('students.show', student.id)
                                            : route('students.index')
                                    }
                                    className="inline-flex"
                                >
                                    <SecondaryButton type="button">
                                        {t('common.cancel')}
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton
                                    type="submit"
                                    disabled={form.processing || categories.length === 0}
                                >
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
