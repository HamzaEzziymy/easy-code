import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaSearch, FaTimes, FaTrash } from 'react-icons/fa';
import { FaGripVertical, FaPlus } from 'react-icons/fa6';

const fieldClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

const empty = {
    license_category_id: '',
    title_fr: '',
    title_ar: '',
    description: '',
    description_ar: '',
    duration_minutes: 40,
    status: 'draft',
    question_ids: [],
    cover: null,
    remove_cover: false,
};

export default function ExamForm({ show, exam, categories, questions, onClose, category }) {
    const { t, i18n } = useTranslation();
    const rtl = (i18n.language ?? '').startsWith('ar');

    const [coverPreview,   setCoverPreview]   = useState(null);
    const [questionSearch, setQuestionSearch] = useState('');
    const [dragIndex,      setDragIndex]      = useState(null);
    const [dragOver,       setDragOver]       = useState(null);
    const form = useForm(empty);

    useEffect(() => {
        if (!show) return;
        form.setData({
            ...empty,
            license_category_id: exam?.categoryId ?? category?.id ?? '',
            title_fr:            exam?.nameFr ?? '',
            title_ar:            exam?.nameAr ?? '',
            description:         exam?.descriptionFr ?? '',
            description_ar:      exam?.descriptionAr ?? '',
            duration_minutes:    exam?.duration ?? 40,
            status:              exam?.status ?? 'draft',
            question_ids:        exam?.questionIds ?? [],
        });
        form.clearErrors();
        setCoverPreview(null);
        setQuestionSearch('');
        setDragIndex(null);
        setDragOver(null);
    }, [show, exam, category]);

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
    const shownCover = form.data.remove_cover ? null : coverPreview ?? exam?.coverUrl;

    const selectedSet = new Set(form.data.question_ids);
    const filteredAvailable = questions.filter((q) => {
        if (selectedSet.has(q.id)) return false;
        if (!questionSearch.trim()) return true;
        const s = questionSearch.toLowerCase();
        return (q.textFr ?? '').toLowerCase().includes(s) || (q.textAr ?? '').toLowerCase().includes(s);
    });
    const selectedQuestions = form.data.question_ids.map((id) => questions.find((q) => q.id === id)).filter(Boolean);

    const addQuestion    = (q)  => { if (!selectedSet.has(q.id)) form.setData('question_ids', [...form.data.question_ids, q.id]); };
    const removeQuestion = (id) => form.setData('question_ids', form.data.question_ids.filter((qid) => qid !== id));

    const handleDragStart = (e, idx) => { setDragIndex(idx); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver  = (e, idx) => { e.preventDefault(); if (idx !== dragIndex) setDragOver(idx); };
    const handleDrop = (e, dropIdx) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIdx) { setDragIndex(null); setDragOver(null); return; }
        const ids = [...form.data.question_ids];
        const [moved] = ids.splice(dragIndex, 1);
        ids.splice(dropIdx, 0, moved);
        form.setData('question_ids', ids);
        setDragIndex(null); setDragOver(null);
    };
    const handleDragEnd = () => { setDragIndex(null); setDragOver(null); };

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => (exam ? { ...data, _method: 'patch' } : data));
        form.post(exam ? route('exams.update', exam.id) : route('exams.store'), {
            preserveScroll: true, preserveState: true, forceFormData: true,
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    const categoryCode = exam
        ? (categories.find((c) => c.id == form.data.license_category_id)?.code ?? '—')
        : (category?.code ?? '—');

    return (
        <Modal show={show} maxWidth="5xl" onClose={onClose}>
            <form onSubmit={submit} className="flex max-h-[92vh] flex-col">

                {/* ── Header ── */}
                <header className="flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-x-3">
                        {/* Category badge */}
                        <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1.5 font-mono text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {categoryCode}
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {exam ? t('categoryDashboard.editExam', 'Edit exam') : t('categoryDashboard.createExam')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('categoryDashboard.examDesc')}
                            </p>
                        </div>
                    </div>
                    <InputError message={form.errors.license_category_id} />
                    <button type="button" onClick={onClose} aria-label={t('common.close')}
                        className="-me-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200">
                        <FaTimes size={14} />
                    </button>
                </header>

                {/* ── Settings strip ── */}
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">

                        {/* Title FR */}
                        <div className="min-w-[11rem] flex-1">
                            <InputLabel htmlFor="exam-title-fr" value={t('tests.nameFr')} />
                            <TextInput id="exam-title-fr" className={fieldClass} value={form.data.title_fr}
                                onChange={(e) => form.setData('title_fr', e.target.value)} />
                            <InputError message={form.errors.title_fr} />
                        </div>

                        {/* Title AR */}
                        <div className="min-w-[11rem] flex-1">
                            <InputLabel htmlFor="exam-title-ar" value={t('tests.nameAr')} />
                            <TextInput id="exam-title-ar" dir="rtl" className={fieldClass} value={form.data.title_ar}
                                onChange={(e) => form.setData('title_ar', e.target.value)} />
                            <InputError message={form.errors.title_ar} />
                        </div>



                        {/* Status */}
                        <div className="w-32 shrink-0">
                            <InputLabel htmlFor="exam-status" value={t('tests.status')} />
                            <select id="exam-status" value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                                className={fieldClass}>
                                <option value="draft">{t('tests.status_draft')}</option>
                                <option value="published">{t('tests.status_published')}</option>
                                <option value="archived">{t('tests.status_archived')}</option>
                            </select>
                            <InputError message={form.errors.status} />
                        </div>

                        {/* Cover */}
                        <div className="shrink-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('tests.chooseCover')}
                            </p>
                            <div className="relative mt-1">
                                <label className={`flex h-[2.375rem] w-[2.375rem] cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition ${
                                    shownCover ? 'border-transparent' : 'border-dashed border-gray-300 bg-white hover:border-[#007BFF] dark:border-gray-600 dark:bg-gray-900'
                                }`}>
                                    {shownCover ? <img src={shownCover} alt="" className="h-full w-full rounded-lg object-cover" /> : <FaCamera size={14} className="text-gray-400" />}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                        onChange={(e) => pickCover(e.target.files?.[0] ?? null)} />
                                </label>
                                {shownCover && (
                                    <button type="button" onClick={clearCover}
                                        className="absolute -end-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        <FaTimes size={8} />
                                    </button>
                                )}
                            </div>
                            <InputError message={form.errors.cover} />
                        </div>
                    </div>

                    {/* Descriptions — FR + AR */}
                    <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="exam-description" value={t('tests.descriptionFr')} />
                            <textarea id="exam-description" rows={2} className={fieldClass} value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)} />
                            <InputError message={form.errors.description} />
                        </div>
                        <div>
                            <InputLabel htmlFor="exam-description-ar" value={t('tests.descriptionAr')} />
                            <textarea id="exam-description-ar" dir="rtl" rows={2} className={fieldClass} value={form.data.description_ar}
                                onChange={(e) => form.setData('description_ar', e.target.value)} />
                            <InputError message={form.errors.description_ar} />
                        </div>
                    </div>
                </div>

                {/* ── Two-panel question picker ── */}
                <div className="flex min-h-0 flex-1 overflow-hidden">

                    {/* LEFT — available */}
                    <div className="flex w-1/2 flex-col border-e border-gray-200 dark:border-gray-700">
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('tests.availableQuestions')}
                                <span className="ms-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {filteredAvailable.length}
                                </span>
                            </p>
                            <div className="relative mt-2">
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                    <FaSearch size={11} />
                                </span>
                                <input type="search" value={questionSearch}
                                    onChange={(e) => setQuestionSearch(e.target.value)}
                                    placeholder={t('tests.searchQuestions')}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pe-3 ps-8 text-xs text-gray-900 outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/25 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
                            </div>
                        </div>
                        <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                            {filteredAvailable.slice(0, 100).map((q) => (
                                <li key={q.id}>
                                    <button type="button" onClick={() => addQuestion(q)}
                                        className="group flex w-full items-start gap-x-2 px-4 py-3 text-start transition-colors hover:bg-[#007BFF]/5 dark:hover:bg-[#00AEEF]/10">
                                        <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            #{q.id}
                                        </span>
                                        <span className="line-clamp-2 flex-1 text-xs text-gray-700 dark:text-gray-300" dir={rtl ? 'rtl' : 'ltr'}>
                                            {rtl ? (q.textAr || q.textFr) : (q.textFr || q.textAr)}
                                        </span>
                                        <span className="ms-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                            <FaPlus size={10} className="text-[#007BFF]" />
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
                                <li className="py-12 text-center text-xs text-gray-400">{t('tests.noQuestionsFound')}</li>
                            )}
                        </ul>
                    </div>

                    {/* RIGHT — selected (drag-and-drop) */}
                    <div className="flex w-1/2 flex-col">
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('tests.selectedQuestions')}
                                <span className={`ms-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    form.data.question_ids.length > 0
                                        ? 'bg-[#007BFF]/10 text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                    {form.data.question_ids.length}
                                </span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{t('tests.dragToReorder')}</p>
                        </div>
                        <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                            {selectedQuestions.map((q, idx) => (
                                <li key={q.id} draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e)  => handleDragOver(e, idx)}
                                    onDrop={(e)      => handleDrop(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex select-none items-start gap-x-2 px-4 py-3 transition-colors ${
                                        dragIndex === idx ? 'opacity-40' :
                                        dragOver  === idx ? 'bg-[#007BFF]/5 dark:bg-[#00AEEF]/10' :
                                        'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                    }`}>
                                    <span className="mt-0.5 shrink-0 cursor-grab text-gray-300 active:cursor-grabbing dark:text-gray-600">
                                        <FaGripVertical size={13} />
                                    </span>
                                    <span className="mt-0.5 shrink-0 rounded bg-[#007BFF]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#007BFF] dark:bg-[#00AEEF]/15 dark:text-[#00AEEF]">
                                        {idx + 1}
                                    </span>
                                    <span dir={rtl ? 'rtl' : 'ltr'} className="line-clamp-2 flex-1 text-xs text-gray-700 dark:text-gray-300">
                                        {rtl ? (q.textAr || q.textFr) : (q.textFr || q.textAr)}
                                    </span>
                                    <button type="button" onClick={() => removeQuestion(q.id)}
                                        className="shrink-0 rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-600 dark:hover:bg-red-500/15 dark:hover:text-red-400">
                                        <FaTrash size={10} />
                                    </button>
                                </li>
                            ))}
                            {selectedQuestions.length === 0 && (
                                <li className="flex flex-col items-center justify-center py-16 text-center">
                                    <FaPlus size={20} className="text-gray-200 dark:text-gray-700" />
                                    <p className="mt-3 text-xs text-gray-400">{t('tests.noSelectedQuestions')}</p>
                                </li>
                            )}
                        </ul>
                        <InputError className="px-4 pb-2" message={form.errors.question_ids} />
                    </div>
                </div>

                {/* ── Footer ── */}
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
