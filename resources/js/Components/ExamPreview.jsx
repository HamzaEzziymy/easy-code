import Modal from '@/Components/Modal';
import { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import {
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaHourglassEnd,
    FaImage,
    FaRotateLeft,
    FaVolumeHigh,
    FaChevronLeft,
    FaChevronRight,
    FaClipboardCheck,
} from 'react-icons/fa6';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

/* ─────────────────────────────────────────────────────────────────────────────
   ExamPreview
   Layout (matches the reference image):

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Header: title · question N/total  ···  [FR][AR]  [↺]  [✕]             │
   ├──────────────────────────────────┬──────────────────────────────────────┤
   │                                  │  [1]                                 │
   │   image                          │  [2]                                 │
   │                                  │  [3]                                 │
   │   question text                  │  [4]                                 │
   │   choice list                    │                                      │
   │                                  │  [Réponse]  [Vérifier]              │
   │                                  │                                      │
   │                                  │  [←]  1/4  [→]                      │
   └──────────────────────────────────┴──────────────────────────────────────┘
   │  Footer result bar (only when answered)                                  │
   └─────────────────────────────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────────── */
export default function ExamPreview({ item, questions, show, onClose, initialLang = 'fr' }) {
    const [lang,     setLang]     = useState(initialLang);
    const [qIndex,   setQIndex]   = useState(0);
    const [answers,  setAnswers]  = useState({});   // { [qIndex]: number[] }
    const [done,     setDone]     = useState(false);
    const [left,     setLeft]     = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const timerRef  = useRef(null);
    const audioRef  = useRef(null);
    const [imgRatio, setImgRatio] = useState(null);

    /* ── question list ── */
    const questionList = (item?.questionIds ?? [])
        .map(id => questions.find(q => q.id === id))
        .filter(Boolean);
    const total    = questionList.length;
    const current  = questionList[qIndex] ?? null;
    const timePerQ = current?.timeSeconds ?? 30;

    /* ── helpers ── */
    const inLang  = (ar, fr) => (lang === 'ar' ? ar : fr) ?? (lang === 'ar' ? fr : ar);
    const image   = inLang(current?.media?.imageAr, current?.media?.imageFr);
    const sound   = inLang(current?.media?.audioAr, current?.media?.audioFr);
    const text    = inLang(current?.textAr, current?.textFr);
    const choices = current?.choices ?? [];
    const correct = choices.flatMap((c, i) => (c.correct ? [i] : []));
    const isImgBased = current?.format === 'image_based';
    const rtl     = lang === 'ar';

    const picked     = answers[qIndex] ?? [];
    const expired    = left <= 0;

    /* ── sync lang on open ── */
    useEffect(() => { if (show) setLang(initialLang); }, [show, initialLang]);

    /* ── reset on open / close ── */
    useEffect(() => {
        if (!show) {
            setQIndex(0); setAnswers({}); setDone(false);
            setTimerRunning(false);
            clearInterval(timerRef.current);
        }
    }, [show]);

    /* ── reset timer on question change ── */
    useEffect(() => {
        if (show && !done) {
            setLeft(timePerQ);
            // If no audio for this question, start immediately
            setTimerRunning(!sound);
        }
    }, [show, qIndex, current?.id]);

    /* ── reset image ratio on question/lang change ── */
    useEffect(() => setImgRatio(null), [current?.id, lang]);

    /* ── countdown — only runs when timerRunning is true ── */
    useEffect(() => {
        if (!show || done || !timerRunning) return;
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setLeft(s => { if (s <= 1) { clearInterval(timerRef.current); return 0; } return s - 1; });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [show, qIndex, done, timerRunning]);

    /* ── audio autoplay — start timer when audio ends ── */
    useEffect(() => {
        if (!audioRef.current) return;
        const el = audioRef.current;

        if (!sound) {
            // No audio on this question — timer already started above
            return;
        }

        // Pause any previous playback, reset, then play
        el.currentTime = 0;
        el.play()?.catch(() => {
            // If autoplay is blocked, start timer immediately as fallback
            setTimerRunning(true);
        });

        const handleEnded = () => setTimerRunning(true);
        el.addEventListener('ended', handleEnded);
        return () => el.removeEventListener('ended', handleEnded);
    }, [current?.id, lang, sound]);

    /* ── keyboard ── */
    useEffect(() => {
        if (!show) return;
        const h = (e) => {
            if (e.key === 'Escape') onClose();
            if (!done && !e.target.matches('input,textarea')) {
                if (e.key === 'ArrowRight') advance();
                if (e.key === 'ArrowLeft')  retreat();
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [show, qIndex, done, total]);

    /* ── actions ── */
    const pick = (index) => {
        if (expired) return;
        setAnswers(a => {
            const cur  = a[qIndex] ?? [];
            const next = cur.includes(index)
                ? cur.filter(i => i !== index)
                : [...cur, index].sort((a, b) => a - b);
            return { ...a, [qIndex]: next };
        });
    };

    const advance = () => { if (qIndex < total - 1) setQIndex(i => i + 1); else setDone(true); };
    const retreat = () => { if (qIndex > 0) setQIndex(i => i - 1); };

    const reset = () => {
        setQIndex(0); setAnswers({}); setDone(false);
        setTimerRunning(false);
        clearInterval(timerRef.current);
        setLeft(questionList[0]?.timeSeconds ?? 30);
    };

    /* ── score (based on answers submitted via Valider) ── */
    const score = questionList.reduce((acc, q, idx) => {
        const p  = answers[idx] ?? [];
        const cr = (q.choices ?? []).flatMap((c, i) => c.correct ? [i] : []);
        return acc + (p.length > 0 && p.length === cr.length && cr.every(i => p.includes(i)) ? 1 : 0);
    }, 0);
    const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed   = scorePct >= (item?.passPercentage ?? 70);

    /* ── answer button colour ── */
    const tone = (index) => {
        if (picked.includes(index)) return 'border-[#007BFF] bg-[#007BFF] text-white shadow-sm';
        return 'border-gray-300 bg-white text-gray-700 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200';
    };

    /* ── image/text layout (mirrors QuestionPreview exactly) ── */
    const split = !isImgBased && Boolean(image) && imgRatio !== null && imgRatio < 1;
    const mediaClass = `relative overflow-hidden rounded-t-2xl bg-black ${
        isImgBased
            ? 'flex-1 rounded-2xl'
            : `min-h-[26vh] flex-1 lg:min-h-0 ${split ? 'lg:w-[52%] lg:flex-none lg:rounded-bl-2xl lg:rounded-tr-none' : ''}`
    }`;
    const sheetClass = `shrink-0 rounded-b-2xl border-t border-gray-200 p-4 sm:p-5 dark:border-gray-700 ${
        split ? 'lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:rounded-tr-2xl lg:rounded-bl-none lg:border-t-0 lg:border-l' : ''
    }`;

    const clock  = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const bar    = timePerQ > 0 ? Math.max(0, Math.min(100, (left / timePerQ) * 100)) : 0;
    const urgent = bar <= 25;
    const title  = rtl ? (item?.nameAr || item?.nameFr) : (item?.nameFr || item?.nameAr);

    return (
        <Modal show={show} fullHeight onClose={onClose}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3 sm:px-5 dark:border-gray-700">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    {!done && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {rtl ? `السؤال ${qIndex + 1} من ${total}` : `Question ${qIndex + 1} / ${total}`}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-x-2">
                    {/* FR / AR */}
                    <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                        {['fr', 'ar'].map(l => (
                            <button key={l} type="button" onClick={() => { setLang(l); reset(); }}
                                className={`rounded-[10px] px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                                    lang === l ? 'bg-[#007BFF] text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}>
                                {l === 'fr' ? 'FR' : 'AR'}
                            </button>
                        ))}
                    </div>
                    {/* Restart */}
                    <button type="button" onClick={reset}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700">
                        <FaRotateLeft size={13} />
                    </button>
                    {/* Close */}
                    <button type="button" onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700">
                        <FaTimes size={14} />
                    </button>
                </div>
            </header>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-5 lg:overflow-hidden dark:bg-gray-950">

                {/* ── Results screen ── */}
                {done ? (
                    <div className="flex h-full flex-col items-center justify-center gap-y-6 overflow-y-auto">
                        <div className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            {passed ? <FaCircleCheck size={40} /> : <FaCircleXmark size={40} />}
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{scorePct}%</p>
                            <p className="mt-1 text-lg font-semibold text-gray-600 dark:text-gray-300">
                                {score} / {total} {rtl ? 'إجابات صحيحة' : 'bonnes réponses'}
                            </p>
                            <p className={`mt-2 text-sm font-semibold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                {passed
                                    ? (rtl ? '🎉 ناجح!' : '🎉 Réussi!')
                                    : (rtl ? '❌ راسب' : '❌ Échoué')}
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-1.5">
                            {questionList.map((q, idx) => {
                                const p  = answers[idx] ?? [];
                                const cr = (q.choices ?? []).flatMap((c, i) => c.correct ? [i] : []);
                                const ok = p.length > 0 && p.length === cr.length && cr.every(i => p.includes(i));
                                return (
                                    <div key={q.id} className="flex items-center gap-x-3 rounded-xl bg-white px-4 py-2.5 shadow-sm dark:bg-gray-800">
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ok ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                            {ok ? '✓' : '✗'}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300" dir={rtl ? 'rtl' : 'ltr'}>
                                            {rtl ? (q.textAr || q.textFr) : (q.textFr || q.textAr)}
                                        </span>
                                        <button type="button" onClick={() => { setQIndex(idx); setDone(false); }}
                                            className="shrink-0 text-xs text-[#007BFF] underline">
                                            {rtl ? 'مراجعة' : 'Revoir'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button type="button" onClick={reset}
                            className="rounded-xl bg-[#007BFF] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0068d6]">
                            {rtl ? 'إعادة المحاولة' : 'Recommencer'}
                        </button>
                    </div>

                ) : (
                    /* ── Question view ── */
                    <div dir="ltr" className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">

                        {/* LEFT — image + question text (identical to QuestionPreview) */}
                        <div className={`${panel} flex min-h-0 flex-1 flex-col ${split ? 'lg:flex-row' : ''}`}>
                            <div className={mediaClass}>
                                {image ? (
                                    <img key={image} src={image} alt=""
                                        onLoad={e => setImgRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-y-2 text-gray-500">
                                        <FaImage size={22} />
                                    </div>
                                )}
                                {sound && (
                                    <>
                                        <audio ref={audioRef} src={sound} preload="auto" />
                                        <button type="button" onClick={() => audioRef.current?.play()}
                                            className="absolute bottom-3 start-3 inline-flex items-center gap-x-2 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/70">
                                            <FaVolumeHigh size={12} /> Play
                                        </button>
                                    </>
                                )}
                            </div>

                            {!isImgBased && (
                                <div dir={rtl ? 'rtl' : 'ltr'} className={sheetClass}>
                                    <p className="mt-0.5 text-2xl font-bold leading-relaxed text-gray-900 sm:text-3xl dark:text-gray-100">
                                        {text}
                                    </p>
                                    <ol className="mt-6 space-y-4">
                                        {choices.map((choice, index) => {
                                            const lbl = rtl ? choice.ar : choice.fr;
                                            const pfx = rtl ? choice.prefixAr : choice.prefixFr;
                                            return (
                                                <li key={choice.key ?? index} className="space-y-1">
                                                    {pfx && (
                                                        <span className="block text-lg font-semibold text-gray-500 dark:text-gray-400">{pfx}</span>
                                                    )}
                                                    <div className="flex min-w-0 items-end gap-x-2">
                                                        <span className="shrink-0 text-xl font-medium leading-tight text-gray-800 dark:text-gray-100">{lbl}</span>
                                                        <span className="mb-1 min-w-0 flex-1 border-b-2 border-dotted border-gray-300 dark:border-gray-600" />
                                                        <span dir="ltr" className="shrink-0 font-mono text-xl font-bold tabular-nums text-gray-600 dark:text-gray-300">{index + 1}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* RIGHT — answer buttons + Réponse/Vérifier + ← → */}
                        <div className={`${panel} flex shrink-0 flex-col p-4 lg:w-56`}>

                            {/* Timer strip */}
                            <div className="mb-3 flex items-center gap-x-2">
                                <FaClock size={12} className={
                                    !timerRunning ? 'text-gray-300 dark:text-gray-600' :
                                    expired ? 'text-red-400' :
                                    urgent  ? 'text-amber-400' : 'text-gray-400'
                                } />
                                <span dir="ltr" className={`font-mono text-sm font-semibold tabular-nums ${
                                    !timerRunning ? 'text-gray-300 dark:text-gray-600' :
                                    expired ? 'text-red-600 dark:text-red-300' :
                                    urgent  ? 'text-amber-600 dark:text-amber-300' :
                                              'text-gray-700 dark:text-gray-200'
                                }`}>
                                    {timerRunning ? clock : '—:——'}
                                </span>
                                <div className="ms-auto h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                                        !timerRunning ? 'bg-gray-200 dark:bg-gray-600' :
                                        expired ? 'bg-red-500' :
                                        urgent  ? 'bg-amber-500' : 'bg-[#007BFF]'
                                    }`}
                                        style={{ width: timerRunning ? `${bar}%` : '100%' }} />
                                </div>
                            </div>

                            {/* Answer buttons 1–4 */}
                            <div className="grid grid-cols-1 gap-3">
                                {[0, 1, 2, 3].map(index => (
                                    <button key={index} type="button"
                                        onClick={() => pick(index)}
                                        disabled={expired}
                                        aria-pressed={picked.includes(index)}
                                        className={`flex w-full items-center justify-center rounded-full border-2 py-3 text-lg font-semibold tabular-nums transition-colors disabled:opacity-50 ${tone(index)}`}>
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Corriger + Valider */}
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {/* Corriger — clears picks so user can re-answer */}
                                <button type="button"
                                    onClick={() => setAnswers(a => ({ ...a, [qIndex]: [] }))}
                                    disabled={picked.length === 0}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-red-400/50 dark:hover:bg-red-500/10 dark:hover:text-red-300">
                                    {rtl ? 'تصحيح' : 'Corriger'}
                                </button>

                                {/* Valider — lock answer and go to next question */}
                                <button type="button"
                                    onClick={advance}
                                    disabled={picked.length === 0 || expired}
                                    className="rounded-xl bg-[#007BFF] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0068d6] disabled:opacity-40">
                                    {rtl ? 'تأكيد' : 'Valider'}
                                </button>
                            </div>

                            {/* ← page N/total → */}
                            <div className="mt-auto flex items-center justify-between pt-5">
                                <button type="button" onClick={retreat} disabled={qIndex === 0}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                                    <FaChevronLeft size={13} />
                                </button>

                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {qIndex + 1} / {total}
                                </span>

                                <button type="button" onClick={advance}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                                    {qIndex < total - 1
                                        ? <FaChevronRight size={13} />
                                        : <FaClipboardCheck size={13} className="text-emerald-500" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer result bar — only on time expiry ───────────────── */}
            {!done && expired && (
                <footer className="flex shrink-0 flex-wrap items-center gap-x-2 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 sm:px-5 dark:bg-amber-500/15 dark:text-amber-200">
                    <FaHourglassEnd size={15} />
                    <span>{rtl ? 'انتهى الوقت!' : 'Temps écoulé!'}</span>
                    {qIndex < total - 1 && (
                        <button type="button" onClick={advance}
                            className="ms-auto flex items-center gap-x-1 rounded-lg bg-amber-100 px-3 py-1 text-xs transition hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30">
                            {rtl ? 'التالي' : 'Suivant'} <FaChevronRight size={10} />
                        </button>
                    )}
                </footer>
            )}
        </Modal>
    );
}
