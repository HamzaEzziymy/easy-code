import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaTimes } from 'react-icons/fa';

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

    const onPick = (event) => {
        pickIcon(event.target.files?.[0] ?? null);
        event.target.value = '';
    };

    const clearIcon = () => {
        if (iconPreview) {
            pickIcon(null);
            return;
        }
        form.setData('icon', null);
        form.setData('remove_icon', true);
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

        // PHP only reads a multipart body on POST, so the PATCH has to be spoofed.
        form.transform((data) => (category ? { ...data, _method: 'patch' } : data));

        form.post(category ? route('categories.update', category.id) : route('categories.store'), options);
    };

    const shownIcon = form.data.remove_icon ? null : iconPreview ?? category?.iconUrl;

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
                    <div className="flex items-start gap-x-4">
                        <div className="flex-1">
                            <InputLabel htmlFor="category-code" value={t('categories.code')} />
                            <TextInput
                                id="category-code"
                                className={`${fieldClass} font-mono uppercase`}
                                value={form.data.code}
                                onChange={(event) => form.setData('code', event.target.value)}
                                isFocused
                            />
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {t('categories.codeHelp')}
                            </p>
                        </div>
                        <div className="shrink-0 pt-6">
                            <div className="relative">
                                <label
                                    title={t('categories.chooseIcon')}
                                    className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-y-1.5 overflow-hidden rounded-xl border text-center transition ${
                                        shownIcon
                                            ? 'border-transparent hover:border-dashed hover:border-[#007BFF]'
                                            : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#007BFF] dark:border-gray-600 dark:bg-gray-900'
                                    }`}
                                >
                                    {shownIcon ? (
                                        <img src={shownIcon} alt="" className="h-full w-full object-contain" />
                                    ) : (
                                        <>
                                            <FaCamera size={18} className="text-gray-400" />
                                            <span className="px-1 text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                                                {t('categories.chooseIcon')}
                                            </span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        onChange={onPick}
                                    />
                                </label>
                                {shownIcon && (
                                    <button
                                        type="button"
                                        onClick={clearIcon}
                                        title={iconPreview ? t('categories.discardIcon') : t('categories.removeIcon')}
                                        aria-label={iconPreview ? t('categories.discardIcon') : t('categories.removeIcon')}
                                        className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <InputError message={form.errors.code} />
                    <InputError message={form.errors.icon} />
                    <p className="-mt-2 text-xs text-gray-600 dark:text-gray-400">{t('categories.iconHelp')}</p>

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
