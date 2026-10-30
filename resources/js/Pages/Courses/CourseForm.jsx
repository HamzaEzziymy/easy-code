import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaFilePdf, FaTimes } from 'react-icons/fa';

const fieldClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

const empty = {
    license_category_id: '',
    name_fr: '',
    name_ar: '',
    description_fr: '',
    description_ar: '',
    status: 'draft',
    cover: null,
    pdf_fr: null,
    pdf_ar: null,
    remove_cover: false,
    remove_pdf_fr: false,
    remove_pdf_ar: false,
};

export default function CourseForm({ show, course, categories, onClose, category }) {
    const { t, i18n } = useTranslation();
    const rtl = (i18n.language ?? '').startsWith('ar');

    const [coverPreview, setCoverPreview] = useState(null);
    const form = useForm(empty);

    useEffect(() => {
        if (!show) return;
        form.setData({
            ...empty,
            license_category_id: course?.categoryId ?? category?.id ?? '',
            name_fr:             course?.nameFr ?? '',
            name_ar:             course?.nameAr ?? '',
            description_fr:      course?.descriptionFr ?? '',
            description_ar:      course?.descriptionAr ?? '',
            status:              course?.status ?? 'draft',
        });
        form.clearErrors();
        setCoverPreview(null);
    }, [show, course, category]);

    const pickCover = (file) => {
        form.setData('cover', file ?? null);
        form.setData('remove_cover', false);
        setCoverPreview(file ? URL.createObjectURL(file) : null);
    };

    const clearCover = () => {
        if (coverPreview) { pickCover(null); return; }
        form.setData('cover', null);
        form.setData('remove_cover', true);
    };

    const shownCover = form.data.remove_cover ? null : coverPreview ?? course?.coverUrl;

    const submit = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => { form.reset(); onClose(); },
        };
        form.transform((data) => (course ? { ...data, _method: 'patch' } : data));
        form.post(course ? route('courses.update', course.id) : route('courses.store'), options);
    };

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose}>
            <form onSubmit={submit} className="flex max-h-[88vh] flex-col">
                <header className="flex items-start justify-between gap-x-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {course ? t('courses.editTitle') : t('courses.createTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {course ? t('courses.editHelp') : t('courses.createHelp')}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label={t('common.close')}
                        className="-me-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                        <FaTimes size={14} />
                    </button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    {/* Cover + Category row */}
                    <div className="flex items-start gap-x-4">
                        <div className="flex-1">
                            <InputLabel htmlFor="course-category" value={t('courses.category')} />
                            <select
                                id="course-category"
                                value={form.data.license_category_id}
                                onChange={(e) => form.setData('license_category_id', e.target.value)}
                                className={fieldClass}
                            >
                                <option value="">{t('courses.selectCategory')}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code} – {rtl ? cat.nameAr || cat.nameFr : cat.nameFr || cat.nameAr}
                                    </option>
                                ))}
                            </select>
                            <InputError className="mt-2" message={form.errors.license_category_id} />
                        </div>

                        {/* Cover image picker */}
                        <div className="shrink-0 pt-6">
                            <div className="relative">
                                <label title={t('courses.chooseCover')}
                                    className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-y-1.5 overflow-hidden rounded-xl border text-center transition ${
                                        shownCover
                                            ? 'border-transparent hover:border-dashed hover:border-[#007BFF]'
                                            : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#007BFF] dark:border-gray-600 dark:bg-gray-900'
                                    }`}>
                                    {shownCover ? (
                                        <img src={shownCover} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <>
                                            <FaCamera size={18} className="text-gray-400" />
                                            <span className="px-1 text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                                                {t('courses.chooseCover')}
                                            </span>
                                        </>
                                    )}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                        onChange={(e) => pickCover(e.target.files?.[0] ?? null)} />
                                </label>
                                {shownCover && (
                                    <button type="button" onClick={clearCover}
                                        className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-red-500/20 dark:hover:text-red-300">
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <InputError message={form.errors.cover} />

                    {/* Names */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="course-name-fr" value={t('courses.nameFr')} />
                            <TextInput id="course-name-fr" className={fieldClass} value={form.data.name_fr}
                                onChange={(e) => form.setData('name_fr', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.name_fr} />
                        </div>
                        <div>
                            <InputLabel htmlFor="course-name-ar" value={t('courses.nameAr')} />
                            <TextInput id="course-name-ar" dir="rtl" className={fieldClass} value={form.data.name_ar}
                                onChange={(e) => form.setData('name_ar', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.name_ar} />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="course-desc-fr" value={t('courses.descriptionFr')} />
                            <textarea id="course-desc-fr" rows={4} className={fieldClass} value={form.data.description_fr}
                                onChange={(e) => form.setData('description_fr', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.description_fr} />
                        </div>
                        <div>
                            <InputLabel htmlFor="course-desc-ar" value={t('courses.descriptionAr')} />
                            <textarea id="course-desc-ar" dir="rtl" rows={4} className={fieldClass} value={form.data.description_ar}
                                onChange={(e) => form.setData('description_ar', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.description_ar} />
                        </div>
                    </div>

                    {/* PDFs */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <PdfPicker
                            label={t('courses.pdfFr')}
                            current={course?.pdfFrUrl}
                            removed={form.data.remove_pdf_fr}
                            onPick={(file) => { form.setData('pdf_fr', file); form.setData('remove_pdf_fr', false); }}
                            onRemove={() => { form.setData('pdf_fr', null); form.setData('remove_pdf_fr', true); }}
                            error={form.errors.pdf_fr}
                        />
                        <PdfPicker
                            label={t('courses.pdfAr')}
                            current={course?.pdfArUrl}
                            removed={form.data.remove_pdf_ar}
                            onPick={(file) => { form.setData('pdf_ar', file); form.setData('remove_pdf_ar', false); }}
                            onRemove={() => { form.setData('pdf_ar', null); form.setData('remove_pdf_ar', true); }}
                            error={form.errors.pdf_ar}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <InputLabel htmlFor="course-status" value={t('courses.status')} />
                        <select id="course-status" value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value)}
                            className={fieldClass}>
                            <option value="draft">{t('courses.status_draft')}</option>
                            <option value="published">{t('courses.status_published')}</option>
                            <option value="archived">{t('courses.status_archived')}</option>
                        </select>
                        <InputError className="mt-2" message={form.errors.status} />
                    </div>
                </div>

                <footer className="flex items-center justify-end gap-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                    <SecondaryButton type="button" onClick={onClose}>{t('common.cancel')}</SecondaryButton>
                    <PrimaryButton type="submit" disabled={form.processing}>
                        {form.processing ? t('common.saving') : t('common.save')}
                    </PrimaryButton>
                </footer>
            </form>
        </Modal>
    );
}

function PdfPicker({ label, current, removed, onPick, onRemove, error }) {
    const { t } = useTranslation();
    const [newFile, setNewFile] = useState(null);

    const shownFile = removed ? null : newFile ?? current;

    const handlePick = (e) => {
        const file = e.target.files?.[0] ?? null;
        setNewFile(file ? file.name : null);
        onPick(file);
        e.target.value = '';
    };

    const handleRemove = () => {
        setNewFile(null);
        onRemove();
    };

    return (
        <div>
            <InputLabel value={label} />
            <div className="mt-1 flex items-center gap-x-3">
                <label className="flex cursor-pointer items-center gap-x-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 transition hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-[#00AEEF] dark:hover:text-[#00AEEF]">
                    <FaFilePdf size={16} className="shrink-0 text-red-500" />
                    <span className="truncate max-w-[140px]">{newFile ?? (current && !removed ? current.split('/').pop().substring(0, 20) + '…' : t('courses.choosePdf'))}</span>
                    <input type="file" accept="application/pdf" className="sr-only" onChange={handlePick} />
                </label>
                {shownFile && (
                    <button type="button" onClick={handleRemove}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-300">
                        <FaTimes size={12} />
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
