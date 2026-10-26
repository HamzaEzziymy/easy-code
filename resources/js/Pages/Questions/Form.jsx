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
    FaPlus,
    FaVolumeHigh,
    FaXmark,
} from 'react-icons/fa6';

const fieldBase =
    'mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500';

const fieldClass = `${fieldBase} text-base`;

/** The wording is what gets read on the exam slide, so it is typed at the size it is shown at. */
const areaClass = `${fieldBase} text-lg leading-relaxed`;

const panel =
    'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

/** The letters a question's choices are stored under, in the slot order the exam screen numbers. */
const KEYS = ['A', 'B', 'C', 'D'];

const SLOTS = ['image_ar', 'image_fr', 'audio_ar', 'audio_fr'];

/** The form fields are named after the columns; the page hands the saved files back in camelCase. */
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
                <label htmlFor={htmlFor} className="block text-base font-medium text-gray-700 dark:text-gray-200">
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

export default function Form({ question, categories }) {
    const { t, i18n } = useTranslation();
    const isEdit = question !== null;
    const uiRtl = i18n.language?.startsWith('ar');

    // A question is written one language at a time, the way the trainee reads it.
    const [lang, setLang] = useState(() => (i18n.language?.startsWith('ar') ? 'ar' : 'fr'));
    const rtl = lang === 'ar';

    const [previews, setPreviews] = useState(() =>
        Object.fromEntries(SLOTS.map((slot) => [slot, question?.media?.[MEDIA_PROPS[slot]] ?? null])),
    );

    // Tracks which choice label rows the user has dismissed (by index).
    // A dismissed row is hidden and its prefix fields are cleared.
    const [hiddenLabels, setHiddenLabels] = useState(() => new Set());

    const form = useForm({
        question_fr: question?.textFr ?? '',
        question_ar: question?.textAr ?? '',
        license_category_id: question?.categoryId ? String(question.categoryId) : '',
        time_limit_seconds: String(question?.timeSeconds ?? '30'),
        options: KEYS.map((key) => {
            const choice = question?.choices.find((item) => item.key === key);

            return {
                prefix_fr: choice?.prefixFr ?? '',
                prefix_ar: choice?.prefixAr ?? '',
                fr: choice?.fr ?? '',
                ar: choice?.ar ?? '',
            };
        }),
        correct: question
            ? question.choices
                  .filter((choice) => choice.correct)
                  .map((choice) => KEYS.indexOf(choice.key))
                  .filter((index) => index >= 0)
            : [0],
        image_ar: null,
        image_fr: null,
        audio_ar: null,
        audio_fr: null,
        remove_image_ar: false,
        remove_image_fr: false,
        remove_audio_ar: false,
        remove_audio_fr: false,
    });

    const title = isEdit ? `${t('questions.editTitle')} #${question.id}` : t('questions.createTitle');

    // Every write rebuilds from the state the previous write left behind, never from the snapshot
    // this render closed over, so two clicks in a row both land.
    const setOption = (index, locale, value) =>
        form.setData((data) => ({
            ...data,
            options: data.options.map((option, i) => (i === index ? { ...option, [locale]: value } : option)),
        }));

    // A label fronts the choice, not one language: clearing both stops the other one being copied
    // back over it when the question is saved.
    const clearLabel = (index) => {
        form.setData((data) => ({
            ...data,
            options: data.options.map((option, i) =>
                i === index ? { ...option, prefix_fr: '', prefix_ar: '' } : option,
            ),
        }));
        setHiddenLabels((prev) => new Set([...prev, index]));
    };

    const restoreLabel = (index) =>
        setHiddenLabels((prev) => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });

    const isChecked = (index) => form.data.correct.includes(index);

    const toggleCorrect = (index) =>
        form.setData((data) => ({
            ...data,
            correct: data.correct.includes(index)
                ? data.correct.filter((value) => value !== index)
                : [...data.correct, index].sort((a, b) => a - b),
        }));

    const pickMedia = (slot, event) => {
        const file = event.target.files?.[0] ?? null;

        form.setData(slot, file);
        form.setData(`remove_${slot}`, false);
        setPreviews((current) => ({
            ...current,
            [slot]: file ? URL.createObjectURL(file) : (question?.media?.[MEDIA_PROPS[slot]] ?? null),
        }));
        event.target.value = '';
    };

    const clearMedia = (slot) => {
        form.setData(slot, null);
        form.setData(`remove_${slot}`, true);
        setPreviews((current) => ({ ...current, [slot]: null }));
    };

    const submit = (event) => {
        event.preventDefault();

        // PHP only reads a multipart body on POST, so the PATCH has to be spoofed.
        form.transform((data) => (isEdit ? { ...data, _method: 'patch' } : data));

        form.post(isEdit ? route('questions.update', question.id) : route('questions.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const shown = (slot) => (form.data[`remove_${slot}`] ? null : previews[slot]);

    const mediaBox = (slot, kind) => {
        const choose = kind === 'image' ? t('questions.chooseImage') : t('questions.chooseAudio');
        const preview = shown(slot);

        return (
            <div>
                <div
                    className={`flex items-center justify-center overflow-hidden rounded-xl border ${
                        preview
                            ? 'border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900/40'
                            : 'border-dashed border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                    } ${kind === 'image' ? 'min-h-[32vh]' : 'py-4'}`}
                >
                    {preview ? (
                        kind === 'image' ? (
                            <img src={preview} alt="" className="max-h-[52vh] w-full object-contain" />
                        ) : (
                            <audio src={preview} controls className="w-full" />
                        )
                    ) : (
                        <p className="px-3 text-center text-sm text-gray-600 dark:text-gray-400">
                            {kind === 'image' ? t('questions.previewNoImage') : t('questions.chooseAudio')}
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
                            onChange={(event) => pickMedia(slot, event)}
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

    const filled = (locale) => form.data[`question_${locale}`].trim() !== '';

    /** Emptying a field with one click, instead of selecting its text and deleting it. */
    const clearButton = (onClick, title) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-500/20"
        >
            <FaXmark size={12} />
        </button>
    );

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
                                {isEdit ? t('questions.editHelp') : t('questions.createHelp')}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="me-1 text-[#FF9800]">*</span>
                        {t('questions.requiredLegend')}
                    </p>
                </div>
            }
        >
            <Head title={title} />

            <form onSubmit={submit} className="py-8" encType="multipart/form-data">
                <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                        <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                            {['fr', 'ar'].map((locale) => (
                                <button
                                    key={locale}
                                    type="button"
                                    onClick={() => setLang(locale)}
                                    className={`relative rounded-[10px] px-6 py-2.5 text-base font-semibold uppercase tracking-wide transition-colors ${
                                        lang === locale
                                            ? 'bg-[#007BFF] text-white'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                                    }`}
                                >
                                    {t(`questions.lang.${locale}`)}
                                    {!filled(locale) && (
                                        <span
                                            className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF9800]"
                                            title={t('questions.langEmpty', {
                                                lang: t(`questions.lang.${locale}`),
                                            })}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('questions.langHelp')}</p>
                    </div>

                    {/* The same sheet the trainee sees: picture, then the wording under it, then the answers. */}
                    <section className={`${panel} overflow-hidden`}>
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

                        <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-5 p-4 sm:p-5">
                            <Field
                                label={t('questions.question')}
                                htmlFor={`question-${lang}`}
                                required
                                error={form.errors[`question_${lang}`]}
                                action={
                                    filled(lang)
                                        ? clearButton(() => form.setData(`question_${lang}`, ''), t('questions.clear'))
                                        : null
                                }
                            >
                                <textarea
                                    id={`question-${lang}`}
                                    dir={rtl ? 'rtl' : 'ltr'}
                                    rows={4}
                                    className={areaClass}
                                    value={form.data[`question_${lang}`]}
                                    onChange={(event) => form.setData(`question_${lang}`, event.target.value)}
                                />
                            </Field>

                            <div>
                                <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    {t('questions.choicesSection')}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {t('questions.choicesHelp')} {t('questions.correctHint')}
                                </p>

                                <div className="mt-3 space-y-3">
                                    {form.data.options.map((option, index) => (
                                        <div key={index} className="flex items-end gap-x-3">
                                            <div className="min-w-0 flex-1 space-y-2">
                                                {hiddenLabels.has(index) ? (
                                                    /* Label row removed — show a restore button instead */
                                                    <div className="flex items-center gap-x-2">
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">
                                                            {t('questions.label')}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => restoreLabel(index)}
                                                            title={t('questions.addLabel')}
                                                            aria-label={t('questions.addLabel')}
                                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-400 transition-colors hover:border-[#007BFF] hover:bg-blue-50 hover:text-[#007BFF] dark:border-gray-600 dark:text-gray-500 dark:hover:bg-blue-500/10 dark:hover:text-[#7EB8F5]"
                                                        >
                                                            <FaPlus size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Field
                                                        label={t('questions.label')}
                                                        htmlFor={`choice-label-${index}`}
                                                        error={form.errors[`options.${index}.prefix_${lang}`]}
                                                        action={clearButton(() => clearLabel(index), t('questions.removeLabel'))}
                                                    >
                                                        <textarea
                                                            id={`choice-label-${index}`}
                                                            dir={rtl ? 'rtl' : 'ltr'}
                                                            rows={2}
                                                            maxLength={60}
                                                            placeholder="a)"
                                                            value={option[`prefix_${lang}`]}
                                                            onChange={(event) =>
                                                                setOption(index, `prefix_${lang}`, event.target.value)
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </Field>
                                                )}
                                                <Field
                                                    label={t('questions.choice')}
                                                    htmlFor={`choice-text-${index}`}
                                                    required={index < 2}
                                                    error={form.errors[`options.${index}.${lang}`]}
                                                >
                                                    <input
                                                        id={`choice-text-${index}`}
                                                        dir={rtl ? 'rtl' : 'ltr'}
                                                        placeholder={t('questions.answer')}
                                                        value={option[lang]}
                                                        onChange={(event) => setOption(index, lang, event.target.value)}
                                                        className={fieldClass}
                                                    />
                                                </Field>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => toggleCorrect(index)}
                                                aria-pressed={isChecked(index)}
                                                title={t('questions.correct')}
                                                aria-label={`${t('questions.correct')} ${index + 1}`}
                                                dir="ltr"
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold tabular-nums transition-colors ${
                                                    isChecked(index)
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-gray-300 bg-white text-gray-500 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <InputError className="mt-3" message={form.errors.options} />
                                <InputError className="mt-1" message={form.errors.correct} />
                                {form.errors['correct.0'] && (
                                    <InputError className="mt-1" message={form.errors['correct.0']} />
                                )}
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {t('questions.correctCount', { count: form.data.correct.length })}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={`${panel} p-4 sm:p-5`}>
                        <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                            <FaGear size={12} className="text-[#007BFF] dark:text-[#00AEEF]" />
                            {t('questions.settingsSection')}
                        </h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field
                                label={t('questions.category')}
                                htmlFor="question-category"
                                hint={t('questions.categoryHelp')}
                                error={form.errors.license_category_id}
                            >
                                <select
                                    id="question-category"
                                    className={fieldClass}
                                    value={form.data.license_category_id}
                                    onChange={(event) => form.setData('license_category_id', event.target.value)}
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
                            <Field
                                label={t('questions.time')}
                                htmlFor="question-time"
                                required
                                hint={t('questions.timeHelp')}
                                error={form.errors.time_limit_seconds}
                            >
                                <div className="relative">
                                    <input
                                        id="question-time"
                                        dir="ltr"
                                        type="text"
                                        inputMode="numeric"
                                        className={`${fieldClass} pe-14 font-mono tabular-nums`}
                                        value={form.data.time_limit_seconds}
                                        onChange={(event) =>
                                            form.setData(
                                                'time_limit_seconds',
                                                toLatinDigits(event.target.value).replace(/\D/g, ''),
                                            )
                                        }
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {t('questions.seconds')}
                                    </span>
                                </div>
                            </Field>
                        </div>
                    </section>

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
