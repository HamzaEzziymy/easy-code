import Modal from '@/Components/Modal';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import {
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaHourglassEnd,
    FaImage,
    FaRotateLeft,
    FaVolumeHigh,
} from 'react-icons/fa6';

const panel = 'rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

/**
 * The trainee screen the whole bank is written for: the picture and the question are one sheet, the
 * picture filling it down to the wording, and the numbered answers are the column on the right.
 */
export default function QuestionPreview({ question, onClose }) {
    const { t, i18n } = useTranslation();
    const audio = useRef(null);

    const [lang, setLang] = useState('ar');
    const [picked, setPicked] = useState([]);
    const [checked, setChecked] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [left, setLeft] = useState(0);
    const [ratio, setRatio] = useState(null);

    const open = question !== null;
    const total = question?.timeSeconds ?? 0;
    const expired = total > 0 && left <= 0;

    // The dialog stays mounted between rows, so every question starts unanswered on a full clock.
    useEffect(() => {
        setPicked([]);
        setChecked(false);
        setRevealed(false);
        setLeft(total);
    }, [question?.id, total]);

    useEffect(() => {
        if (!open || expired) {
            return;
        }
        const ticker = setInterval(() => setLeft((seconds) => (seconds > 0 ? seconds - 1 : 0)), 1000);

        return () => clearInterval(ticker);
    }, [open, expired]);

    // A new picture is a new shape, so the layout waits for it to measure instead of keeping the
    // arrangement the previous language's image chose.
    useEffect(() => setRatio(null), [question?.id, lang]);

    const rtl = lang === 'ar';
    const choices = question?.choices ?? [];
    const correct = choices.flatMap((choice, index) => (choice.correct ? [index] : []));
    const inLang = (arabic, french) => (lang === 'ar' ? arabic : french) ?? (lang === 'ar' ? french : arabic);
    const image = inLang(question?.media.imageAr, question?.media.imageFr);
    const sound = inLang(question?.media.audioAr, question?.media.audioFr);
    const text = inLang(question?.textAr, question?.textFr);
    const label = (choice) => inLang(choice.ar, choice.fr);
    const prefix = (choice) => inLang(choice.prefixAr, choice.prefixFr);

    const isImageBased = question?.format === 'image_based';

    // A tall picture — a panneau, a dashcam strip, a phone screenshot — keeps its height beside the
    // wording; a wide one lies down on top and pushes the sheet under it.
    // For image-based questions the image IS the question — it fills the full card.
    const split = !isImageBased && Boolean(image) && ratio !== null && ratio < 1;
    const mediaClass = `relative overflow-hidden rounded-t-2xl bg-black ${
        isImageBased
            ? 'flex-1 rounded-2xl'
            : `min-h-[26vh] flex-1 lg:min-h-0 ${split ? 'lg:w-[52%] lg:flex-none lg:rounded-bl-2xl lg:rounded-tr-none' : ''}`
    }`;
    const sheetClass = `shrink-0 rounded-b-2xl border-t border-gray-200 p-4 sm:p-5 dark:border-gray-700 ${
        split
            ? 'lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:rounded-tr-2xl lg:rounded-bl-none lg:border-t-0 lg:border-l'
            : ''
    }`;

    // The recording is the question read out, so it starts with the slide and on every language
    // switch; a browser that blocks it leaves the speaker button over the picture.
    useEffect(() => {
        if (!open || !sound) {
            return;
        }
        const player = audio.current;

        if (!player) {
            return;
        }
        player.currentTime = 0;
        player.play()?.catch(() => {});
    }, [open, question?.id, lang, sound]);

    if (!open) {
        return null;
    }

    const successful =
        picked.length > 0 &&
        picked.length === correct.length &&
        correct.every((index) => picked.includes(index));

    const pick = (index) => {
        if (expired) {
            return;
        }
        setChecked(false);
        setPicked((current) =>
            current.includes(index)
                ? current.filter((value) => value !== index)
                : [...current, index].sort((a, b) => a - b),
        );
    };

    const reset = () => {
        setPicked([]);
        setChecked(false);
        setRevealed(false);
        setLeft(total);
    };

    const tone = (index) => {
        const isCorrect = correct.includes(index);

        if ((revealed || checked) && isCorrect) {
            return 'border-emerald-500 bg-emerald-500 text-white';
        }
        if (checked && picked.includes(index)) {
            return 'border-red-500 bg-red-500 text-white';
        }
        if (picked.includes(index)) {
            return 'border-[#007BFF] bg-[#007BFF] text-white shadow-sm';
        }

        return 'border-gray-300 bg-white text-gray-700 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200';
    };

    const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const bar = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;
    const urgent = bar <= 25;

    return (
        <Modal show={open} fullHeight onClose={onClose}>
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3 sm:px-5 dark:border-gray-700">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        {t('questions.previewTitle')}
                    </h3>
                    <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                        {t('questions.previewHelp')}
                    </p>
                </div>
                <div className="flex items-center gap-x-2">
                    <div className="inline-flex rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                        {['fr', 'ar'].map((locale) => (
                            <button
                                key={locale}
                                type="button"
                                onClick={() => {
                                    setLang(locale);
                                    reset();
                                }}
                                className={`rounded-[10px] px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                                    lang === locale
                                        ? 'bg-[#007BFF] text-white'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}
                            >
                                {t(`questions.lang.${locale}`)}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={reset}
                        title={t('questions.previewReset')}
                        aria-label={t('questions.previewReset')}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                        <FaRotateLeft size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        title={t('common.close')}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-5 lg:overflow-hidden dark:bg-gray-950">
                {/* The sheet follows the exam language, but the answer column never moves off the
                    right edge, so the row is pinned left-to-right in both directions. */}
                <div dir="ltr" className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
                    <div className={`${panel} flex min-h-0 flex-1 flex-col ${split ? 'lg:flex-row' : ''}`}>
                        <div className={mediaClass}>
                            {image ? (
                                <img
                                    key={image}
                                    src={image}
                                    alt=""
                                    onLoad={(event) =>
                                        setRatio(
                                            event.currentTarget.naturalWidth /
                                                event.currentTarget.naturalHeight,
                                        )
                                    }
                                    className={`h-full w-full ${isImageBased ? 'object-contain' : 'object-contain'}`}
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-y-2 text-gray-500">
                                    <FaImage size={22} />
                                    <span className="px-4 text-center text-sm">
                                        {t('questions.previewNoImage', { lng: lang })}
                                    </span>
                                </div>
                            )}

                            {sound && (
                                <>
                                    <audio ref={audio} src={sound} preload="auto" />
                                    <button
                                        type="button"
                                        onClick={() => audio.current?.play()}
                                        className="absolute bottom-3 start-3 inline-flex items-center gap-x-2 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/70"
                                    >
                                        <FaVolumeHigh size={12} />
                                        {t('questions.previewPlay', { lng: lang })}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Text sheet — hidden for image-based questions */}
                        {!isImageBased && (
                        <div dir={rtl ? 'rtl' : 'ltr'} className={sheetClass}>
                            <p
                                className={`mt-0.5 text-2xl font-bold leading-relaxed sm:text-3xl ${
                                    expired
                                        ? 'text-gray-400 line-through dark:text-gray-500'
                                        : 'text-gray-900 dark:text-gray-100'
                                }`}
                            >
                                {text}
                            </p>

                            <ol className="mt-6 space-y-4">
                                {choices.map((choice, index) => (
                                    <li key={choice.key ?? index} className="space-y-1">
                                        {prefix(choice) && (
                                            <span className="block text-lg font-semibold text-gray-500 dark:text-gray-400">
                                                {prefix(choice)}
                                            </span>
                                        )}
                                        <div className="flex min-w-0 items-end gap-x-2">
                                            <span
                                                className={`shrink-0 text-xl font-medium leading-tight ${
                                                    expired
                                                        ? 'text-gray-400 line-through dark:text-gray-500'
                                                        : 'text-gray-800 dark:text-gray-100'
                                                }`}
                                            >
                                                {label(choice)}
                                            </span>
                                            <span className="mb-1 min-w-0 flex-1 border-b-2 border-dotted border-gray-300 dark:border-gray-600" />
                                            <span
                                                dir="ltr"
                                                className="shrink-0 font-mono text-xl font-bold tabular-nums text-gray-600 dark:text-gray-300"
                                            >
                                                {index + 1}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        )}
                    </div>

                    <div className={`${panel} flex shrink-0 flex-col p-4 lg:w-56`}>
                        <div className="flex items-center gap-x-2">
                            <FaClock
                                size={13}
                                className={
                                    expired
                                        ? 'text-red-500'
                                        : urgent
                                          ? 'text-amber-500'
                                          : 'text-gray-400 dark:text-gray-500'
                                }
                            />
                            <span
                                dir="ltr"
                                className={`font-mono text-sm font-semibold tabular-nums ${
                                    expired
                                        ? 'text-red-600 dark:text-red-300'
                                        : urgent
                                          ? 'text-amber-600 dark:text-amber-300'
                                          : 'text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                {clock}
                            </span>
                            <span className="ms-auto text-[10px] font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
                                {t('questions.time', { lng: lang })}
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                            <div
                                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                                    expired ? 'bg-red-500' : urgent ? 'bg-amber-500' : 'bg-[#007BFF]'
                                }`}
                                style={{ width: `${bar}%` }}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2 lg:mt-5 lg:grid-cols-1 lg:gap-3">
                            {[...Array(4)].map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => pick(index)}
                                    disabled={expired}
                                    aria-pressed={picked.includes(index)}
                                    aria-label={choices[index] ? label(choices[index]) : `${index + 1}`}
                                    title={choices[index] ? label(choices[index]) : `${index + 1}`}
                                    className={`flex aspect-square w-full items-center justify-center rounded-full border-2 text-lg font-semibold tabular-nums transition-colors disabled:opacity-50 lg:aspect-auto lg:py-3 ${tone(index)}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-auto lg:pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setChecked(false);
                                    setRevealed((current) => !current);
                                }}
                                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                                    revealed
                                        ? 'border-[#007BFF] bg-[#007BFF] text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#007BFF] hover:text-[#007BFF] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                            >
                                {t('questions.previewCheck', { lng: lang })}
                            </button>
                            <button
                                type="button"
                                onClick={() => setChecked(true)}
                                disabled={picked.length === 0 || expired}
                                className="rounded-xl bg-[#007BFF] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0068d6] disabled:opacity-40"
                            >
                                {t('questions.previewSubmit', { lng: lang })}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {(checked || expired) && (
                <footer
                    className={`flex shrink-0 flex-wrap items-center gap-x-2 px-4 py-3 text-sm font-semibold sm:px-5 ${
                        expired
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                            : successful
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                              : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
                    }`}
                >
                    {expired ? (
                        <>
                            <FaHourglassEnd size={15} />
                            <span dir={rtl ? 'rtl' : 'ltr'}>
                                {t('questions.previewTimeUp', { lng: lang })}
                            </span>
                        </>
                    ) : successful ? (
                        <>
                            <FaCircleCheck size={15} />
                            <span dir={rtl ? 'rtl' : 'ltr'}>{t('questions.previewRight', { lng: lang })}</span>
                        </>
                    ) : (
                        <>
                            <FaCircleXmark size={15} />
                            <span dir={rtl ? 'rtl' : 'ltr'}>
                                {t('questions.previewWrong', {
                                    lng: lang,
                                    answers: correct.map((index) => index + 1).join(' · '),
                                })}
                            </span>
                        </>
                    )}
                </footer>
            )}
        </Modal>
    );
}
