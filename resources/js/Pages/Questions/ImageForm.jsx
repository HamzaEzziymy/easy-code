import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toLatinDigits } from '@/Support/digits';
import {
    FaArrowLeft,
    FaFloppyDisk,
    FaGear,
    FaImage,
    FaVolumeHigh,
    FaXmark,
} from 'react-icons/fa6';

const fieldBase =
    'mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500';

const fieldClass = `${fieldBase} text-base`;

const panel =
    'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

const KEYS = ['A', 'B', 'C', 'D'];

const SLOTS = ['image_ar', 'image_fr', 'audio_ar', 'audio_fr'];

const MEDIA_PROPS = {
    image_ar: 'imageAr',
    image_fr: 'imageFr',
    audio_ar: 'audioAr',
    audio_fr: 'audioFr',
};

function Field({ label, htmlFor, hint, error, required, action, children }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-x-2">
                <label
                    htmlFor={htmlFor}
                    className="block text-base font-medium text-gray-700 dark:text-gray-200"
                >
                    {label}
                    {required && (
                        <span className="ms-1 text-[#FF9800]" aria-hidden>
                            *
                        </span>
                    )}
                </label>
                {action}
            </div>
            {children}
            <InputError className="mt-1.5" message={error} />
            {hint && <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{hint}</p>}
        </div>
    );
}

export default function ImageForm({ question, categories }) {
    const { t, i18n } = useTranslation();
    const isEdit = question !== null;
    const uiRtl = i18n.language?.startsWith('ar');

    // Same language switcher pattern as the text form — controls which media slot is shown.
    const [lang, setLang] = useState('ar');

    const [previews, setPreviews] = useState(() =>
        Object.fromEntries(
            SLOTS.map((slot) => [slot, question?.media?.[MEDIA_PROPS[slot]] ?? null]),
        ),
    );

    const form = useForm({
        question_format: 'image_based',
        license_category_id: question?.categoryId ? String(question.categoryId) : '',
        time_limit_seconds: String(question?.timeSeconds ?? '30'),
        correct: question
            ? (question.choices ?? [])
                  .filter((c) => c.correct)
                  .map((c) => KEYS.indexOf(c.key))
                  .filter((i) => i >= 0)
            : [],
        explanation_ar: question?.explanationAr ?? '',
        explanation_fr: question?.explanationFr ?? '',
        image_ar: null,
        image_fr: null,
        audio_ar: null,
        audio_fr: null,
        remove_image_ar: false,
        remove_image_fr: false,
        remove_audio_ar: false,
        remove_audio_fr: false,
    });

    const title = isEdit
        ? `${t('questions.editTitle')} #${question.id}`
        : t('questions.createImageTitle');

    const isChecked = (index) => form.data.correct.includes(index);

    const toggleCorrect = (index) =>
        form.setData((data) => ({
            ...data,
            correct: data.correct.includes(index)
                ? data.correct.filter((v) => v !== index)
                : [...data.correct, index].sort((a, b) => a - b),
        }));

    const pickMedia = (slot, event) => {
        const file = event.target.files?.[0] ?? null;
        form.setData(slot, file);
        form.setData(`remove_${slot}`, false);
        setPreviews((current) => ({
            ...current,
            [slot]: file
                ? URL.createObjectURL(file)
                : (question?.media?.[MEDIA_PROPS[slot]] ?? null),
        }));
        event.target.value = '';
    };

    const clearMedia = (slot) => {
        form.setData(slot, null);
        form.setData(`remove_${slot}`, true);
        setPreviews((current) => ({ ...current, [slot]: null }));
    };

    const shown = (slot) => (form.data[`remove_${slot}`] ? null : previews[slot]);

    const submit = (event) => {
        event.preventDefault();
        form.transform((data) => (isEdit ? { ...data, _method: 'patch' } : data));
        form.post(
            isEdit ? route('questions.update', question.id) : route('questions.store'),
            { forceFormData: true, preserveScroll: true },
        );
    };

    // Identical mediaBox helper to Form.jsx
    const mediaBox = (slot, kind) => {
        const choose =
            kind === 'image' ? t('questions.chooseImage') : t('questions.chooseAudio');
        const preview = shown(slot);

        return (
            <div>
                <div
                    className={`flex items-center justify-center overflow-hidden rounded-xl border ${
                        preview
                            ? 'border-gray-200 dark:border-gray-600'
                            : `border-dashed border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700${kind !== 'image' ? ' py-4' : ' py-16'}`
                    }`}
                >
                    {preview ? (
                        kind === 'image' ? (
                            <img
                                src={preview}
                                alt=""
                                className="w-full rounded-xl"
                            />
                        ) : (
                            <audio src={preview} controls className="w-full" />
                        )
                    ) : (
                        <p className="px-3 text-center text-sm text-gray-600 dark:text-gray-400">
                            {kind === 'image'
                                ? t('questions.previewNoImage')
                                : t('questions.chooseAudio')}
                        </p>
                    )}
                </div>

                <div className="mt-2 flex items-center gap-x-2">
                    <label
                        className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-x-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                            preview
                                ? 'border-gray-300 bg-white text-gray-700 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
                                : 'border-[#007BFF] bg-[#007BFF] text-white hover:bg-[#0068d6]'
                        }`}
                    >
                        {kind === 'image' ? <FaImage size={12} /> : <FaVolumeHigh size={12} />}
                        {choose}
                        <input
                            type="file"
                            accept={
                                kind === 'image'
                                    ? 'image/jpeg,image/png,image/webp'
                                    : 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac'
                            }
                            className="sr-only"
                            onChange={(e) => pickMedia(slot, e)}
                        />
                    </label>
                    {preview && (
                        <button
                            type="button"
                            onClick={() => clearMedia(slot)}
                            title={t('questions.removeMedia')}
                            aria-label={t('questions.removeMedia')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-500/20"
                        >
                            <FaXmark size={12} />
                        </button>
                    )}
                </div>

                <InputError className="mt-1.5" message={form.errors[slot]} />
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex items-center gap-x-3">
                        <Link
                            href={route('questions.index')}
                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title={t('questions.back')}
                            aria-label={t('questions.back')}
                        >
                            <FaArrowLeft className="rtl:-scale-x-100" size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                {title}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {isEdit
                                    ? t('questions.editHelp')
                                    : t('questions.createImageHelp')}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={title} />

            <form onSubmit={submit} className="py-8" encType="multipart/form-data">
                <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">

                    {/* Language switcher — same pill as text form */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                        <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                            {['fr', 'ar'].map((locale) => (
                                <button
                                    key={locale}
                                    type="button"
                                    onClick={() => setLang(locale)}
                                    className={`rounded-[10px] px-6 py-2.5 text-base font-semibold uppercase tracking-wide transition-colors ${
                                        lang === locale
                                            ? 'bg-[#007BFF] text-white'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                                    }`}
                                >
                                    {t(`questions.lang.${locale}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main card — image + audio at top, correct buttons below */}
                    <section className={`${panel} overflow-hidden`}>
                        {/* Media block — identical border-b style to text form */}
                        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5 dark:border-gray-700">
                            <div>
                                <h3 className="mb-2 flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    <FaImage size={12} className="text-[#007BFF] dark:text-[#00AEEF]" />
                                    {t('questions.image')} · {t(`questions.lang.${lang}`)}
                                </h3>
                                {mediaBox(`image_${lang}`, 'image')}
                            </div>
                            <div>
                                <h3 className="mb-2 flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    <FaVolumeHigh size={12} className="text-[#007BFF] dark:text-[#00AEEF]" />
                                    {t('questions.audio')} · {t(`questions.lang.${lang}`)}
                                </h3>
                                {mediaBox(`audio_${lang}`, 'audio')}
                            </div>
                        </div>

                        {/* Correct answer buttons — where the text/choices block would be */}
                        <div className="space-y-3 p-4 sm:p-5">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    {t('questions.correctAnswers')}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {t('questions.correctAnswersHelp')}
                                </p>
                            </div>

                            <div className="flex gap-x-4">
                                {[0, 1, 2, 3].map((index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => toggleCorrect(index)}
                                        aria-pressed={isChecked(index)}
                                        title={`${t('questions.correct')} ${index + 1}`}
                                        aria-label={`${t('questions.correct')} ${index + 1}`}
                                        dir="ltr"
                                        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold tabular-nums transition-colors ${
                                            isChecked(index)
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-gray-300 bg-white text-gray-500 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <InputError message={form.errors.correct} />
                            {form.errors['correct.0'] && (
                                <InputError message={form.errors['correct.0']} />
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('questions.correctCount', { count: form.data.correct.length })}
                            </p>
                        </div>
                    </section>

                    {/* Settings — identical to text form */}
                    <section className={`${panel} p-4 sm:p-5`}>
                        <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                            <FaGear size={12} className="text-[#007BFF] dark:text-[#00AEEF]" />
                            {t('questions.settingsSection')}
                        </h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div dir={uiRtl ? 'rtl' : 'ltr'}>
                                <Field
                                    label={t('questions.category')}
                                    htmlFor="question-category"
                                    hint={t('questions.categoryHelp')}
                                    error={form.errors.license_category_id}
                                >
                                    <select
                                        id="question-category"
                                        dir={uiRtl ? 'rtl' : 'ltr'}
                                        className={`${fieldClass} pr-10`}
                                        value={form.data.license_category_id}
                                        onChange={(e) =>
                                            form.setData('license_category_id', e.target.value)
                                        }
                                    >
                                        <option value="">{t('questions.noCategory')}</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.code} —{' '}
                                                {uiRtl
                                                    ? category.nameAr || category.nameFr
                                                    : category.nameFr || category.nameAr}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <div dir={uiRtl ? 'rtl' : 'ltr'}>
                                <Field
                                    label={t('questions.time')}
                                    htmlFor="question-time"
                                    required
                                    hint={t('questions.timeHelp')}
                                    error={form.errors.time_limit_seconds}
                                >
                                    <div className="relative" dir="ltr">
                                        <input
                                            id="question-time"
                                            dir="ltr"
                                            type="text"
                                            inputMode="numeric"
                                            className={`${fieldClass} pr-14 font-mono tabular-nums`}
                                            value={form.data.time_limit_seconds}
                                            onChange={(e) =>
                                                form.setData(
                                                    'time_limit_seconds',
                                                    toLatinDigits(e.target.value).replace(/\D/g, ''),
                                                )
                                            }
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {t('questions.seconds')}
                                        </span>
                                    </div>
                                </Field>
                            </div>
                        </div>

                        <div dir={uiRtl ? 'rtl' : 'ltr'} className="mt-4">
                            <Field
                                label={t('questions.explanation')}
                                htmlFor={`explanation-${lang}`}
                                hint={t('questions.explanationHelp')}
                                error={form.errors[`explanation_${lang}`]}
                            >
                                <textarea
                                    id={`explanation-${lang}`}
                                    dir={uiRtl ? 'rtl' : 'ltr'}
                                    rows={3}
                                    maxLength={2000}
                                    className={`${fieldBase} text-lg leading-relaxed`}
                                    value={form.data[`explanation_${lang}`]}
                                    onChange={(e) => form.setData(`explanation_${lang}`, e.target.value)}
                                    placeholder={t('questions.explanationPlaceholder')}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Footer actions — identical to text form */}
                    <div className="flex items-center justify-end gap-x-3">
                        <Link href={route('questions.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" disabled={form.processing}>
                            <FaFloppyDisk className="me-2" size={12} />
                            {form.processing ? t('common.saving') : t('common.save')}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
