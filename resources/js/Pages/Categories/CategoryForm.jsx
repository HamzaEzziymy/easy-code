import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaTrash, FaTimes } from 'react-icons/fa';

const fieldClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

const empty = {
    code: '',
    name_fr: '',
    name_ar: '',
    condition_fr: '',
    condition_ar: '',
    icon: null,
    remove_icon: false,
};

export default function CategoryForm({ show, category, onClose }) {
    const { t } = useTranslation();
    const [iconPreview, setIconPreview] = useState(null);

    const form = useForm(empty);

    useEffect(() => {
        if (!show) {
            return;
        }

        form.setData({
            ...empty,
            code: category?.code ?? '',
            name_fr: category?.nameFr ?? '',
            name_ar: category?.nameAr ?? '',
            condition_fr: category?.conditionFr ?? '',
            condition_ar: category?.conditionAr ?? '',
        });
        form.clearErrors();
        setIconPreview(null);
    }, [show, category]);

    const pickIcon = (file) => {
        form.setData('icon', file ?? null);
        form.setData('remove_icon', false);
        setIconPreview(file ? URL.createObjectURL(file) : null);
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        };

        if (category) {
            form.patch(route('categories.update', category.id), options);
            return;
        }
        form.post(route('categories.store'), options);
    };

    const shownIcon = iconPreview ?? category?.iconUrl;

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose}>
            <form onSubmit={submit} className="flex max-h-[88vh] flex-col">
                <header className="flex items-start justify-between gap-x-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {category ? t('categories.editTitle') : t('categories.createTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {category ? t('categories.editHelp') : t('categories.createHelp')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        title={t('common.close')}
                        className="-me-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                        <FaTimes size={14} />
                    </button>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <div className="flex items-end gap-x-4">
                        <div className="flex-1">
                            <InputLabel htmlFor="category-code" value={t('categories.code')} />
                            <TextInput
                                id="category-code"
                                className={`${fieldClass} font-mono uppercase`}
                                value={form.data.code}
                                onChange={(event) => form.setData('code', event.target.value)}
                                isFocused
                            />
                            <InputError className="mt-2" message={form.errors.code} />
                        </div>
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                            {shownIcon ? (
                                <img src={shownIcon} alt="" className="h-full w-full object-contain" />
                            ) : (
                                <FaCamera size={18} className="text-gray-400" />
                            )}
                        </span>
                    </div>
                    <p className="-mt-2 text-xs text-gray-600 dark:text-gray-400">{t('categories.codeHelp')}</p>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-x-2">
                            <label className="inline-flex cursor-pointer items-center gap-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
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
                                    className="inline-flex items-center gap-x-1.5 rounded-lg px-2 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
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
                                    className="inline-flex items-center gap-x-1.5 rounded-lg px-2 py-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-300"
                                >
                                    <FaTrash size={11} />
                                    {t('categories.removeIcon')}
                                </button>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('categories.iconHelp')}</p>
                        <InputError message={form.errors.icon} />
                    </div>

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
                </div>

                <footer className="flex items-center justify-end gap-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel')}
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={form.processing}>
                        {form.processing ? t('common.saving') : t('common.save')}
                    </PrimaryButton>
                </footer>
            </form>
        </Modal>
    );
}
