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
    FaCommentDots,
    FaFloppyDisk,
    FaGear,
    FaImage,
    FaListOl,
    FaVolumeHigh,
    FaXmark,
} from 'react-icons/fa6';

const fieldClass =
    'mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500';

/** The letters the exam screen shows next to each choice, and the slot index it is stored under. */
const KEYS = ['A', 'B', 'C', 'D'];

const MEDIA = [
    { slot: 'image_ar', kind: 'image', labelKey: 'imageAr' },
    { slot: 'audio_ar', kind: 'audio', labelKey: 'audioAr' },
    { slot: 'image_fr', kind: 'image', labelKey: 'imageFr' },
    { slot: 'audio_fr', kind: 'audio', labelKey: 'audioFr' },
];

function Section({ title, description, icon, children }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                <span className="text-[#007BFF] dark:text-[#00AEEF]">{icon}</span>
                {title}
            </h3>
            {description && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{description}</p>}
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Field({ label, htmlFor, hint, error, required, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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

export default function Form({ question, categories }) {
    const { t, i18n } = useTranslation();
    const isEdit = question !== null;
    const rtl = i18n.language?.startsWith('ar');

    const [previews, setPreviews] = useState(() =>
        Object.fromEntries(MEDIA.map(({ slot }) => [slot, isEdit ? question.media[slot] : null])),
    );

    const form = useForm({
        question_fr: question?.textFr ?? '',
        question_ar: question?.textAr ?? '',
        license_category_id: question?.categoryId ? String(question.categoryId) : '',
        time_limit_seconds: String(question?.timeSeconds ?? '30'),
        options: KEYS.map((key) => {
            const choice = question?.choices.find((item) => item.key === key);

            return { fr: choice?.fr ?? '', ar: choice?.ar ?? '' };
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

    const setOption = (index, locale, value) =>
        form.setData('options', form.data.options.map((option, i) => (i === index ? { ...option, [locale]: value } : option)));

    const isChecked = (index) => form.data.correct.includes(index);

    const toggleCorrect = (index) =>
        form.setData(
            'correct',
            isChecked(index)
                ? form.data.correct.filter((value) => value !== index)
                : [...form.data.correct, index].sort((a, b) => a - b),
        );

    const pickMedia = (slot, event) => {
        const file = event.target.files?.[0] ?? null;

        form.setData(slot, file);
        form.setData(`remove_${slot}`, false);
        setPreviews((current) => ({
            ...current,
            [slot]: file ? URL.createObjectURL(file) : isEdit ? question.media[slot] : null,
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

    const shown = (slot) => form.data[`remove_${slot}`] ? null : previews[slot];

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
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="me-1 text-[#FF9800]">*</span>
                        {t('questions.requiredLegend')}
                    </p>
                </div>
            }
        >
            <Head title={title} />

            <form onSubmit={submit} className="py-8" encType="multipart/form-data">
                <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <Section title={t('questions.textSection')} description={t('questions.textHelp')} icon={<FaCommentDots size={13} />}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label={t('questions.questionFr')}
                                htmlFor="question-fr"
                                required
                                error={form.errors.question_fr}
                            >
                                <textarea
                                    id="question-fr"
                                    rows={4}
                                    className={fieldClass}
                                    value={form.data.question_fr}
                                    onChange={(event) => form.setData('question_fr', event.target.value)}
                                />
                            </Field>
                            <Field
                                label={t('questions.questionAr')}
                                htmlFor="question-ar"
                                required
                                error={form.errors.question_ar}
                            >
                                <textarea
                                    id="question-ar"
                                    dir="rtl"
                                    rows={4}
                                    className={fieldClass}
                                    value={form.data.question_ar}
                                    onChange={(event) => form.setData('question_ar', event.target.value)}
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title={t('questions.choicesSection')} description={t('questions.choicesHelp')} icon={<FaListOl size={13} />}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                <span className="w-7 text-center">{t('questions.letter')}</span>
                                <span>{t('questions.choiceFr')}</span>
                                <span dir="rtl" className="text-end">
                                    {t('questions.choiceAr')}
                                </span>
                                <span className="w-16 text-center">{t('questions.correct')}</span>
                            </div>

                            {form.data.options.map((option, index) => (
                                <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-start gap-x-3">
                                    <span
                                        dir="ltr"
                                        className={`mt-3 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                            isChecked(index)
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {KEYS[index]}
                                    </span>
                                    <input
                                        aria-label={`${t('questions.choiceFr')} ${KEYS[index]}`}
                                        className={fieldClass}
                                        value={option.fr}
                                        onChange={(event) => setOption(index, 'fr', event.target.value)}
                                    />
                                    <input
                                        dir="rtl"
                                        aria-label={`${t('questions.choiceAr')} ${KEYS[index]}`}
                                        className={fieldClass}
                                        value={option.ar}
                                        onChange={(event) => setOption(index, 'ar', event.target.value)}
                                    />
                                    <label className="flex h-[42px] w-16 cursor-pointer items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={isChecked(index)}
                                            onChange={() => toggleCorrect(index)}
                                            className="h-5 w-5 rounded border-gray-300 text-[#007BFF] focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-700"
                                            aria-label={`${t('questions.correct')} ${KEYS[index]}`}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                        <InputError className="mt-3" message={form.errors.options} />
                        <InputError className="mt-1" message={form.errors.correct} />
                        {form.errors['correct.0'] && (
                            <InputError className="mt-1" message={form.errors['correct.0']} />
                        )}
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            {t('questions.correctCount', { count: form.data.correct.length })}
                        </p>
                    </Section>

                    <Section title={t('questions.settingsSection')} description={t('questions.settingsHelp')} icon={<FaGear size={13} />}>
                        <div className="grid gap-4 sm:grid-cols-2">
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
                                            {rtl
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
                                    <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {t('questions.seconds')}
                                    </span>
                                </div>
                            </Field>
                        </div>
                    </Section>

                    <Section title={t('questions.mediaSection')} description={t('questions.mediaHelp')} icon={<FaImage size={13} />}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {['ar', 'fr'].map((locale) => (
                                <div key={locale} className="space-y-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                        {t(`questions.lang.${locale}`)}
                                    </h4>
                                    {MEDIA.filter((item) => item.slot.endsWith(locale)).map(({ slot, kind, labelKey }) => {
                                        const choose = kind === 'image' ? t('questions.chooseImage') : t('questions.chooseAudio');

                                        return (
                                        <div key={slot}>
                                            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {t(`questions.${labelKey}`)}
                                            </p>
                                            <div
                                                className={`flex items-center gap-x-3 rounded-xl border ${
                                                    shown(slot)
                                                        ? 'border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900/40'
                                                        : 'border-dashed border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    {shown(slot) ? (
                                                        kind === 'image' ? (
                                                            <img
                                                                src={shown(slot)}
                                                                alt=""
                                                                className="h-24 w-full rounded-lg object-contain"
                                                            />
                                                        ) : (
                                                            <audio src={shown(slot)} controls className="w-full" />
                                                        )
                                                    ) : (
                                                        <p className="px-1 py-4 text-xs text-gray-600 dark:text-gray-400">
                                                            {choose}
                                                        </p>
                                                    )}
                                                </div>
                                                <label
                                                    title={choose}
                                                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:text-gray-300"
                                                >
                                                    {kind === 'image' ? <FaImage size={13} /> : <FaVolumeHigh size={13} />}
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
                                                {shown(slot) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => clearMedia(slot)}
                                                        title={t('questions.removeMedia')}
                                                        aria-label={t('questions.removeMedia')}
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-500/20"
                                                    >
                                                        <FaXmark size={13} />
                                                    </button>
                                                )}
                                            </div>
                                            <InputError className="mt-1.5" message={form.errors[slot]} />
                                        </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </Section>

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
