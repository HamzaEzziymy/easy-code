import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaSearch, FaTimes, FaGripVertical, FaTrash } from 'react-icons/fa';

const fieldClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

const empty = {
    license_category_id: '',
    name_fr: '',
    name_ar: '',
    description_fr: '',
    description_ar: '',
    duration_minutes: 30,
    pass_percentage: 70,
    status: 'draft',
    question_ids: [],
    cover: null,
    remove_cover: false,
};

export default function TestForm({ show, test, categories, questions, onClose, category }) {
    const { t, i18n } = useTranslation();
    const rtl = (i18n.language ?? '').startsWith('ar');

    const [coverPreview, setCoverPreview] = useState(null);
    const [questionSearch, setQuestionSearch] = useState('');
    const form = useForm(empty);

    useEffect(() => {
        if (!show) return;
        form.setData({
            ...empty,
            license_category_id: test?.categoryId ?? category?.id ?? '',
            name_fr:             test?.nameFr ?? '',
            name_ar:             test?.nameAr ?? '',
            description_fr:      test?.descriptionFr ?? '',
            description_ar:      test?.descriptionAr ?? '',
            duration_minutes:    test?.duration ?? 30,
            pass_percentage:     test?.passPercentage ?? 70,
            status:              test?.status ?? 'draft',
            question_ids:        test?.questionIds ?? [],
        });
        form.clearErrors();
        setCoverPreview(null);
        setQuestionSearch('');
    }, [show, test, category]);

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

    const shownCover = form.data.remove_cover ? null : coverPreview ?? test?.coverUrl;

    // Add a question to the selected list
    const addQuestion = (q) => {
        if (form.data.question_ids.includes(q.id)) return;
        form.setData('question_ids', [...form.data.question_ids, q.id]);
    };

    // Remove a question from the selected list
    const removeQuestion = (id) => {
        form.setData('question_ids', form.data.question_ids.filter((qid) => qid !== id));
    };

    // Filtered available questions (not yet selected)
    const selectedSet = new Set(form.data.question_ids);
    const filteredAvailable = questions.filter((q) => {
        if (selectedSet.has(q.id)) return false;
        if (!questionSearch.trim()) return true;
        const s = questionSearch.toLowerCase();
        return (q.textFr ?? '').toLowerCase().includes(s) || (q.textAr ?? '').toLowerCase().includes(s);
    });

    // Selected questions in order
    const selectedQuestions = form.data.question_ids
        .map((id) => questions.find((q) => q.id === id))
        .filter(Boolean);

    const submit = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => { form.reset(); onClose(); },
        };
        form.transform((data) => (test ? { ...data, _method: 'patch' } : data));
        form.post(test ? route('tests.update', test.id) : route('tests.store'), options);
    };

    return (
        <Modal show={show} maxWidth="4xl" onClose={onClose}>
            <form onSubmit={submit} className="flex max-h-[90vh] flex-col">
                <header className="flex items-start justify-between gap-x-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {test ? t('tests.editTitle') : t('tests.createTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {test ? t('tests.editHelp') : t('tests.createHelp')}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label={t('common.close')}
                        className="-me-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                        <FaTimes size={14} />
                    </button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    {/* Cover + Category */}
                    <div className="flex items-start gap-x-4">
                        <div className="flex-1">
                            <InputLabel htmlFor="test-category" value={t('tests.category')} />
                            <select id="test-category" value={form.data.license_category_id}
                                onChange={(e) => form.setData('license_category_id', e.target.value)}
                                className={fieldClass}>
                                <option value="">{t('tests.selectCategory')}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code} – {rtl ? cat.nameAr || cat.nameFr : cat.nameFr || cat.nameAr}
                                    </option>
                                ))}
                            </select>
                            <InputError className="mt-2" message={form.errors.license_category_id} />
                        </div>
                        {/* Cover */}
                        <div className="shrink-0 pt-6">
                            <div className="relative">
                                <label title={t('tests.chooseCover')}
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
                                                {t('tests.chooseCover')}
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

                    {/* Names */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="test-name-fr" value={t('tests.nameFr')} />
                            <TextInput id="test-name-fr" className={fieldClass} value={form.data.name_fr}
                                onChange={(e) => form.setData('name_fr', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.name_fr} />
                        </div>
                        <div>
                            <InputLabel htmlFor="test-name-ar" value={t('tests.nameAr')} />
                            <TextInput id="test-name-ar" dir="rtl" className={fieldClass} value={form.data.name_ar}
                                onChange={(e) => form.setData('name_ar', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.name_ar} />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="test-desc-fr" value={t('tests.descriptionFr')} />
                            <textarea id="test-desc-fr" rows={3} className={fieldClass} value={form.data.description_fr}
                                onChange={(e) => form.setData('description_fr', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.description_fr} />
                        </div>
                        <div>
                            <InputLabel htmlFor="test-desc-ar" value={t('tests.descriptionAr')} />
                            <textarea id="test-desc-ar" dir="rtl" rows={3} className={fieldClass} value={form.data.description_ar}
                                onChange={(e) => form.setData('description_ar', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.description_ar} />
                        </div>
                    </div>

                    {/* Duration + Pass + Status */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="test-duration" value={t('tests.duration')} />
                            <TextInput id="test-duration" type="number" min={1} max={300} className={fieldClass}
                                value={form.data.duration_minutes}
                                onChange={(e) => form.setData('duration_minutes', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.duration_minutes} />
                        </div>
                        <div>
                            <InputLabel htmlFor="test-pass" value={t('tests.passPercentage')} />
                            <TextInput id="test-pass" type="number" min={0} max={100} step={0.01} className={fieldClass}
                                value={form.data.pass_percentage}
                                onChange={(e) => form.setData('pass_percentage', e.target.value)} />
                            <InputError className="mt-2" message={form.errors.pass_percentage} />
                        </div>
                        <div>
                            <InputLabel htmlFor="test-status" value={t('tests.status')} />
                            <select id="test-status" value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                                className={fieldClass}>
                                <option value="draft">{t('tests.status_draft')}</option>
                                <option value="published">{t('tests.status_published')}</option>
                                <option value="archived">{t('tests.status_archived')}</option>
                            </select>
                            <InputError className="mt-2" message={form.errors.status} />
                        </div>
                    </div>

                    {/* Question picker */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {t('tests.questions')}{' '}
                            <span className="rounded-full bg-[#007BFF]/10 px-2 py-0.5 text-xs font-bold text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]">
                                {form.data.question_ids.length}
                            </span>
                        </p>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Available questions */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-700">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('tests.availableQuestions')}
                                    </p>
                                    <div className="relative mt-2">
                                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                            <FaSearch size={11} />
                                        </span>
                                        <input
                                            type="search"
                                            value={questionSearch}
                                            onChange={(e) => setQuestionSearch(e.target.value)}
                                            placeholder={t('tests.searchQuestions')}
                                            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pe-3 ps-8 text-xs text-gray-900 outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                                <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredAvailable.slice(0, 50).map((q) => (
                                        <li key={q.id}>
                                            <button
                                                type="button"
                                                onClick={() => addQuestion(q)}
                                                className="flex w-full items-start gap-x-2 px-3 py-2.5 text-start text-xs text-gray-700 transition-colors hover:bg-[#007BFF]/5 dark:text-gray-300 dark:hover:bg-[#00AEEF]/10"
                                            >
                                                <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                    #{q.id}
                                                </span>
                                                <span className="line-clamp-2 flex-1">
                                                    {rtl ? (q.textAr || q.textFr) : (q.textFr || q.textAr)}
                                                </span>
                                                {q.categoryCode && (
                                                    <span className="shrink-0 rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                        {q.categoryCode}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                    {filteredAvailable.length === 0 && (
                                        <li className="py-6 text-center text-xs text-gray-400">{t('tests.noQuestionsFound')}</li>
                                    )}
                                </ul>
                            </div>

                            {/* Selected questions */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-700">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('tests.selectedQuestions')}
                                    </p>
                                </div>
                                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                    {selectedQuestions.map((q, idx) => (
                                        <li key={q.id} className="flex items-start gap-x-2 px-3 py-2.5">
                                            <span className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600">
                                                <FaGripVertical size={12} />
                                            </span>
                                            <span className="mt-0.5 shrink-0 rounded bg-[#007BFF]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]">
                                                {idx + 1}
                                            </span>
                                            <span className="line-clamp-2 flex-1 text-xs text-gray-700 dark:text-gray-300">
                                                {rtl ? (q.textAr || q.textFr) : (q.textFr || q.textAr)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(q.id)}
                                                className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        </li>
                                    ))}
                                    {selectedQuestions.length === 0 && (
                                        <li className="py-6 text-center text-xs text-gray-400">{t('tests.noSelectedQuestions')}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                        <InputError className="mt-2" message={form.errors.question_ids} />
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
