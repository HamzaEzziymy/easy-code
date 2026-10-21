import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCamera, FaTrash, FaTimes } from 'react-icons/fa';

const fieldClass =
    'mt-1 block w-full rounded-md border border-gray-300 bg-white text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

function Section({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
            )}
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

export default function Form({ category }) {
    const { t } = useTranslation();
    const [iconPreview, setIconPreview] = useState(null);

    const form = useForm({
        code: category?.code ?? '',
        name_fr: category?.nameFr ?? '',
        name_ar: category?.nameAr ?? '',
        condition_fr: category?.conditionFr ?? '',
        condition_ar: category?.conditionAr ?? '',
        icon: null,
        remove_icon: false,
    });

    const pickIcon = (file) => {
        form.setData('icon', file);
        form.setData('remove_icon', false);
        setIconPreview(file ? URL.createObjectURL(file) : null);
    };

    const submit = (event) => {
        event.preventDefault();

        const options = { preserveScroll: true, forceFormData: true };

        if (category) {
            form.patch(route('categories.update', category.id), options);
            return;
        }
        form.post(route('categories.store'), options);
    };

    const shownIcon = iconPreview ?? category?.iconUrl;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full flex-wrap items-center gap-x-4">
                    <Link
                        href={route('categories.index')}
                        className="flex items-center gap-x-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#007BFF] dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <FaArrowLeft size={12} className="rtl:rotate-180" />
                        {t('categories.back')}
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                        {category ? t('categories.editTitle') : t('categories.createTitle')}
                    </h2>
                </div>
            }
        >
            <Head title={category ? t('categories.editTitle') : t('categories.createTitle')} />

            <form onSubmit={submit} className="py-8">
                <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {category ? t('categories.editHelp') : t('categories.createHelp')}
                    </p>

                    <Section title={t('categories.namesSection')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="category-code" value={t('categories.code')} />
                                <TextInput
                                    id="category-code"
                                    className={`${fieldClass} font-mono uppercase`}
                                    value={form.data.code}
                                    onChange={(event) => form.setData('code', event.target.value)}
                                    isFocused
                                />
                                <InputError className="mt-2" message={form.errors.code} />
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {t('categories.codeHelp')}
                                </p>
                            </div>
                            <div className="flex items-end gap-x-3">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                                    {shownIcon ? (
                                        <img src={shownIcon} alt="" className="h-full w-full object-contain" />
                                    ) : (
                                        <FaCamera size={18} className="text-gray-400" />
                                    )}
                                </span>
                                <div className="flex flex-wrap items-center gap-x-2">
                                    <label className="inline-flex cursor-pointer items-center gap-x-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
                                        <FaCamera size={12} />
                                        {t('categories.chooseIcon')}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={(event) => pickIcon(event.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                    {iconPreview && (
                                        <button
                                            type="button"
                                            onClick={() => pickIcon(null)}
                                            className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                                        >
                                            <FaTimes size={11} />
                                            {t('categories.discardIcon')}
                                        </button>
                                    )}
                                    {!iconPreview && category?.iconUrl && !form.data.remove_icon && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setData('icon', null);
                                                form.setData('remove_icon', true);
                                            }}
                                            className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-300"
                                        >
                                            <FaTrash size={11} />
                                            {t('categories.removeIcon')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="category-name-fr" value={t('categories.nameFr')} />
                            <TextInput
                                id="category-name-fr"
                                className={fieldClass}
                                value={form.data.name_fr}
                                onChange={(event) => form.setData('name_fr', event.target.value)}
                            />
                            <InputError className="mt-2" message={form.errors.name_fr} />
                        </div>

                        <div>
                            <InputLabel htmlFor="category-name-ar" value={t('categories.nameAr')} />
                            <TextInput
                                id="category-name-ar"
                                dir="rtl"
                                className={fieldClass}
                                value={form.data.name_ar}
                                onChange={(event) => form.setData('name_ar', event.target.value)}
                            />
                            <InputError className="mt-2" message={form.errors.name_ar} />
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('categories.iconHelp')}</p>
                        <InputError message={form.errors.icon} />
                    </Section>

                    <Section title={t('categories.conditionsSection')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="category-condition-fr" value={t('categories.conditionFr')} />
                                <textarea
                                    id="category-condition-fr"
                                    rows={4}
                                    className={fieldClass}
                                    value={form.data.condition_fr}
                                    onChange={(event) => form.setData('condition_fr', event.target.value)}
                                />
                                <InputError className="mt-2" message={form.errors.condition_fr} />
                            </div>
                            <div>
                                <InputLabel htmlFor="category-condition-ar" value={t('categories.conditionAr')} />
                                <textarea
                                    id="category-condition-ar"
                                    dir="rtl"
                                    rows={4}
                                    className={fieldClass}
                                    value={form.data.condition_ar}
                                    onChange={(event) => form.setData('condition_ar', event.target.value)}
                                />
                                <InputError className="mt-2" message={form.errors.condition_ar} />
                            </div>
                        </div>
                    </Section>

                    <div className="flex items-center justify-end gap-x-3 pb-2">
                        <Link href={route('categories.index')}>
                            <SecondaryButton>{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" disabled={form.processing}>
                            {form.processing ? t('common.saving') : t('common.save')}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
