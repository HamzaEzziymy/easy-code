import StudentLayout from '@/Layouts/StudentLayout';
import PdfViewer, { PdfProgressBar, seedProgressFromServer } from '@/Components/PdfViewer';
import ExamPreview from '@/Components/ExamPreview';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaBook,
    FaChevronLeft,
    FaChevronRight,
    FaCircleCheck,
    FaCirclePlay,
    FaCircleXmark,
    FaClipboardCheck,
    FaClipboardList,
    FaInbox,
} from 'react-icons/fa6';
import { FaClock } from 'react-icons/fa';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const inLang = (rtl, ar, fr) => (rtl ? ar || fr : fr || ar);

const TYPE_META = {
    course: {
        Icon:        FaBook,
        labelKey:    'categoryDashboard.type_course',
        pill:        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300',
        accent:      'from-indigo-400 to-indigo-600',
        placeholder: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/40',
        iconColor:   'text-indigo-300 dark:text-indigo-600',
        headerBg:    'bg-indigo-600',
    },
    test: {
        Icon:        FaClipboardCheck,
        labelKey:    'categoryDashboard.type_test',
        pill:        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
        accent:      'from-emerald-400 to-emerald-600',
        placeholder: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40',
        iconColor:   'text-emerald-300 dark:text-emerald-600',
        headerBg:    'bg-emerald-600',
    },
    exam: {
        Icon:        FaClipboardList,
        labelKey:    'categoryDashboard.type_exam',
        pill:        'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
        accent:      'from-blue-400 to-blue-600',
        placeholder: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40',
        iconColor:   'text-blue-300 dark:text-blue-600',
        headerBg:    'bg-[#007BFF]',
    },
};

const PER_PAGE = 12;

/* ─── Progress sync — the sitting follows the student account ──────────────── */
function saveQuizProgress(item, state) {
    if (!item || !state) return;
    const body = JSON.stringify({
        item_type: item._type,
        item_id:   item.id,
        qIndex:    state.qIndex,
        answers:   state.answers,
        left:      state.left,
        done:      state.done,
        scorePct:  state.scorePct,
        _token:    document.querySelector('meta[name="csrf-token"]')?.content ?? '',
    });

    if (navigator.sendBeacon) {
        navigator.sendBeacon('/student/progress', new Blob([body], { type: 'application/json' }));
        return;
    }

    fetch('/student/progress', {
        method:  'POST',
        headers: {
            'Content-Type':     'application/json',
            'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]')?.content ?? '',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body,
        keepalive: true,
    }).catch(() => {});
}

/* ─── Filter pill ──────────────────────────────────────────────────────────── */
function FilterTab({ value, active, label, icon: Icon, meta, count, onChange }) {
    const base     = 'flex items-center gap-x-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all';
    const inactive = 'border border-gray-200 bg-white text-gray-500 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-100';
    const bdg      = (on) => `inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${on ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`;

    if (value === '') {
        return (
            <button type="button" onClick={() => onChange('')}
                className={`${base} ${active ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : inactive}`}>
                {label}<span className={bdg(active)}>{count}</span>
            </button>
        );
    }
    return (
        <button type="button" onClick={() => onChange(value)}
            className={`${base} ${active ? `bg-gradient-to-r ${meta.accent} text-white shadow-sm` : inactive}`}>
            <Icon size={11} />{label}<span className={bdg(active)}>{count}</span>
        </button>
    );
}

/* ─── Card (cards view) ────────────────────────────────────────────────────── */
function ItemCard({ item, rtl, t, examLanguage, studentId, pdfProgress, progress, onSelect }) {
    const meta    = TYPE_META[item._type] ?? TYPE_META.exam;
    const { Icon } = meta;
    const title   = inLang(rtl, item.nameAr, item.nameFr);
    const desc    = inLang(rtl, item.descriptionAr, item.descriptionFr);

    const pdfUrl  = item._type === 'course'
        ? (examLanguage === 'ar' ? (item.pdfArUrl || item.pdfFrUrl) : (item.pdfFrUrl || item.pdfArUrl))
        : null;
    const pdfSlot  = pdfUrl ? (pdfUrl === item.pdfArUrl ? 'ar' : 'fr') : null;
    const pdfLabel = pdfSlot === 'ar' ? 'AR' : 'FR';
    const pdfPct   = pdfSlot ? (pdfProgress?.[`${item.id}:${pdfSlot}`]?.scrollPct ?? null) : null;
    const answered = progress ? Math.min(progress.qIndex + 1, item.questionsCount || progress.qIndex + 1) : null;
    const resultTotal = progress?.total ?? item.questionsCount;
    const resultCorrect = progress?.correct
        ?? (progress?.scorePct != null && resultTotal ? Math.round((progress.scorePct * resultTotal) / 100) : null);
    const resultPassed = (progress?.scorePct ?? 0) >= (item.passPercentage ?? 70);

    // The PDF progress bar is itself a button, so the card cannot be one.
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item); } }}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-start shadow-[0_1px_3px_rgba(16,24,40,0.10),0_8px_20px_-8px_rgba(16,24,40,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_16px_32px_-14px_rgba(16,24,40,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_2px_4px_rgba(0,0,0,0.45),0_10px_24px_-12px_rgba(0,0,0,0.55)] dark:hover:border-gray-600 dark:hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.6)]"
        >
            {/* Cover */}
            <div className="relative h-36 w-full overflow-hidden">
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${meta.placeholder}`}>
                        <Icon size={44} className={`${meta.iconColor} opacity-50 transition-transform duration-300 group-hover:scale-110`} />
                    </div>
                )}
                <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${meta.pill}`}>
                    <Icon size={8} />{t(meta.labelKey)}
                </span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-3">
                <h4 dir={rtl ? 'rtl' : 'ltr'}
                    className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                    {title || '—'}
                </h4>
                {desc && (
                    <p dir={rtl ? 'rtl' : 'ltr'}
                        className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {desc}
                    </p>
                )}
                {(item.questionsCount !== undefined || progress) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.questionsCount !== undefined && (
                            <span className="inline-flex items-center gap-x-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                <FaClipboardCheck size={8} />{item.questionsCount} {t('tests.questions')}
                            </span>
                        )}
                        {progress && !progress.done && (
                            <span className="inline-flex items-center gap-x-1 rounded-md bg-[#007BFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#007BFF] dark:bg-[#007BFF]/20 dark:text-[#00AEEF]">
                                <FaCirclePlay size={8} />
                                {`${answered}/${item.questionsCount ?? '?'}`}
                            </span>
                        )}
                    </div>
                )}
                {progress?.done && (
                    <div className={`mt-2 flex items-center justify-between gap-x-2 rounded-lg px-2.5 py-1.5 ${
                        resultPassed
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                    }`}>
                        <span className="flex items-center gap-x-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {resultPassed ? <FaCircleCheck size={9} /> : <FaCircleXmark size={9} />}
                            {t('student.result')}
                        </span>
                        <span className="flex items-center gap-x-2 font-extrabold tabular-nums">
                            <span className="text-sm leading-none">{resultCorrect ?? 0}/{resultTotal ?? '?'}</span>
                            <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-bold leading-none dark:bg-black/20">
                                {progress.scorePct ?? 0}%
                            </span>
                        </span>
                    </div>
                )}
                {pdfUrl && (
                    <div className="mt-2">
                        <PdfProgressBar url={pdfUrl} label={pdfLabel} caption={t('student.progress')} studentId={studentId} initialPct={pdfPct}
                            onClick={(e) => { e.stopPropagation(); onSelect(item); }} />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Detail view (replaces cards when item selected) ──────────────────────── */
function DetailView({ item, rtl, t, studentId, examLanguage, pdfProgress, onBack }) {
    const meta    = TYPE_META[item._type] ?? TYPE_META.exam;
    const { Icon } = meta;
    const title   = inLang(rtl, item.nameAr, item.nameFr);
    const desc    = inLang(rtl, item.descriptionAr, item.descriptionFr);

    const pdfUrl  = item._type === 'course'
        ? (examLanguage === 'ar' ? (item.pdfArUrl || item.pdfFrUrl) : (item.pdfFrUrl || item.pdfArUrl))
        : null;
    const pdfSlot = pdfUrl ? (pdfUrl === item.pdfArUrl ? 'ar' : 'fr') : null;
    const pdfPage = pdfSlot ? (pdfProgress?.[`${item.id}:${pdfSlot}`]?.page ?? null) : null;

    // Type pill passed into the PDF viewer header
    const typePill = (
        <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.pill}`}>
            <Icon size={9} />{t(meta.labelKey)}
        </span>
    );

    return (
        <div className="h-full">
            {pdfUrl ? (
                <PdfViewer
                    url={pdfUrl}
                    title={title}
                    typePill={typePill}
                    onBack={onBack}
                    studentId={studentId}
                    courseId={item.id}
                    pdfSlot={pdfSlot}
                    initialPage={pdfPage}
                />
            ) : (
                /* Test / Exam — no PDF */
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.10),0_8px_20px_-8px_rgba(16,24,40,0.18)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_2px_4px_rgba(0,0,0,0.45),0_10px_24px_-12px_rgba(0,0,0,0.55)]">
                    {/* Header with back + type pill + title */}
                    <div className="flex h-12 shrink-0 items-center gap-x-2 border-b border-gray-200 px-3 dark:border-gray-700">
                        <button type="button" onClick={onBack}
                            className="flex shrink-0 items-center gap-x-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            <FaChevronLeft size={9} />
                            <span>{t('students.back')}</span>
                        </button>
                        {typePill}
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                            {title}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className={`flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.placeholder}`}>
                            {item.coverUrl
                                ? <img src={item.coverUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                                : <Icon size={56} className={`${meta.iconColor} opacity-30`} />
                            }
                        </div>
                        {desc && (
                            <p dir={rtl ? 'rtl' : 'ltr'}
                                className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {desc}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {item.questionsCount !== undefined && (
                                <div className="flex items-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700">
                                    <FaClipboardCheck size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('tests.questionsCount')}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.questionsCount}</p>
                                    </div>
                                </div>
                            )}
                            {item.duration !== undefined && (
                                <div className="flex items-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700">
                                    <FaClock size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('tests.duration')}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.duration} {t('tests.minutes')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    return (
        <div className="mt-6 flex items-center justify-center gap-x-1">
            <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <FaChevronLeft size={11} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} type="button" onClick={() => onChange(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${p === page ? 'bg-[#007BFF] text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    {p}
                </button>
            ))}
            <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <FaChevronRight size={11} />
            </button>
        </div>
    );
}

/* ─── Dashboard ────────────────────────────────────────────────────────────── */
export default function Dashboard({ student, courses, tests, exams, questions = [], pdfProgress = {}, quizProgress = {} }) {
    const { t, i18n } = useTranslation();
    const rtl = i18n.language?.startsWith('ar');

    const [typeFilter,    setTypeFilter]    = useState('');
    const [page,          setPage]          = useState(1);
    const [selectedItem,  setSelectedItem]  = useState(null); // null = cards view

    const studentId = student?.studentNumber ?? null;

    // Restore last-viewed item from sessionStorage on mount
    useEffect(() => {
        if (!student) return;
        try {
            const saved = sessionStorage.getItem(`student_selected_${student.studentNumber}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Find the matching item from the current data to get fresh URLs
                const allCurrent = [
                    ...courses.map(c  => ({ ...c,  _type: 'course' })),
                    ...tests.map(tt   => ({ ...tt, _type: 'test'   })),
                    ...exams.map(e    => ({ ...e,  _type: 'exam'   })),
                ];
                const match = allCurrent.find(i => i._type === parsed._type && i.id === parsed.id);
                // A refresh must not throw the trainee back to the card list.
                if (match) setSelectedItem(match);
            }
        } catch { /* silent */ }
    }, []); // eslint-disable-line

    // Reconcile this device's cache with the account's reading progress
    useEffect(() => {
        if (!courses || !pdfProgress || !studentId) return;
        courses.forEach(course => {
            ['fr', 'ar'].forEach(slot => {
                const pdfUrl = slot === 'fr' ? course.pdfFrUrl : course.pdfArUrl;
                if (!pdfUrl) return;
                seedProgressFromServer(
                    studentId,
                    pdfUrl,
                    pdfProgress[`${course.id}:${slot}`] ?? null,
                    course.id,
                    slot,
                );
            });
        });
    }, [pdfProgress]); // eslint-disable-line

    // Another device may have read further while this tab was in the background
    const lastSync = useRef(0);
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() - lastSync.current < 15000) return;
            lastSync.current = Date.now();
            router.reload({ only: ['pdfProgress'] });
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    if (!student) {
        return (
            <StudentLayout student={student}>
                <Head title={t('student.title')} />
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="max-w-sm text-center">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007BFF] to-[#00AEEF] text-white shadow-lg shadow-blue-500/30">
                            <FaInbox size={26} />
                        </span>
                        <p className="mt-6 text-base font-semibold text-gray-900 dark:text-gray-100">{t('student.notEnrolled')}</p>
                        <p className="mx-auto mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t('student.notEnrolledHelp')}</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const examLanguage = student.examLanguage ?? 'fr';

    const allItems = [
        ...courses.map(c  => ({ ...c,  _type: 'course' })),
        ...tests.map(tt   => ({ ...tt, _type: 'test'   })),
        ...exams.map(e    => ({ ...e,  _type: 'exam'   })),
    ];

    const filtered   = typeFilter ? allItems.filter(i => i._type === typeFilter) : allItems;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage   = Math.min(page, totalPages);
    const pageItems  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const handleFilter = (v) => { setTypeFilter(v); setPage(1); };
    const handleSelect = (item) => {
        setSelectedItem(item);
        try { sessionStorage.setItem(`student_selected_${student.studentNumber}`, JSON.stringify({ _type: item._type, id: item.id })); } catch { /* silent */ }
    };
    const handleBack = () => {
        setSelectedItem(null);
        try { sessionStorage.removeItem(`student_selected_${student.studentNumber}`); } catch { /* silent */ }
    };

    return (
        <StudentLayout student={student}>
            <Head title={t('student.title')} />

            {selectedItem ? (
                /* ══ CONTENT VIEW — fills the right pane next to the sidebar ══ */
                <div className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col sm:h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)]">
                    {selectedItem._type === 'course' || !(selectedItem.questionIds?.length > 0) ? (
                        <DetailView
                            item={selectedItem}
                            rtl={rtl}
                            t={t}
                            studentId={studentId}
                            examLanguage={examLanguage}
                            pdfProgress={pdfProgress}
                            onBack={handleBack}
                        />
                    ) : (
                        <ExamPreview
                            embedded
                            item={selectedItem}
                            questions={questions}
                            initialLang={examLanguage}
                            storageKey={`student_quiz_${studentId}_${selectedItem._type}_${selectedItem.id}`}
                            savedState={quizProgress[`${selectedItem._type}:${selectedItem.id}`] ?? null}
                            onPersist={(state) => saveQuizProgress(selectedItem, state)}
                            onClose={handleBack}
                        />
                    )}
                </div>

            ) : (
                /* ══ CARDS VIEW ════════════════════════════════════════════ */
                <>
                    {/* Filter pills — centered */}
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                        <FilterTab value=""       active={typeFilter === ''      } label={t('categoryDashboard.all')}         count={allItems.length} onChange={handleFilter} />
                        <FilterTab value="course" active={typeFilter === 'course'} label={t('categoryDashboard.type_course')} count={courses.length}  icon={TYPE_META.course.Icon} meta={TYPE_META.course} onChange={handleFilter} />
                        <FilterTab value="test"   active={typeFilter === 'test'  } label={t('categoryDashboard.type_test')}   count={tests.length}    icon={TYPE_META.test.Icon}   meta={TYPE_META.test}   onChange={handleFilter} />
                        <FilterTab value="exam"   active={typeFilter === 'exam'  } label={t('categoryDashboard.type_exam')}   count={exams.length}    icon={TYPE_META.exam.Icon}   meta={TYPE_META.exam}   onChange={handleFilter} />
                    </div>

                    {/* Cards grid */}
                    {pageItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FaInbox size={32} className="text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('student.emptyTitle')}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('student.emptyHelp')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {pageItems.map(item => (
                                <ItemCard
                                    key={`${item._type}-${item.id}`}
                                    item={item}
                                    rtl={rtl}
                                    t={t}
                                    examLanguage={examLanguage}
                                    studentId={studentId}
                                    pdfProgress={pdfProgress}
                                    progress={quizProgress[`${item._type}:${item.id}`]}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </StudentLayout>
    );
}
