import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { FaTimes, FaExternalLinkAlt, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).toString();

/* ── LocalStorage ─────────────────────────────────────────────────────────── */
const PDF_STORAGE_KEY = 'pdf_progress';

function readAll() {
    try { return JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}'); } catch { return {}; }
}

function persist(url, page, total) {
    if (!url || total < 1) return;
    const pct = Math.round((page / total) * 100);
    const all = readAll();
    all[url] = { page, total, scrollPct: pct };
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('pdf-progress-update'));
}

function savedPage(url) {
    return readAll()[url]?.page ?? 1;
}

/* ── Render one page onto a <canvas> at device pixel ratio ───────────────── */
function PdfCanvas({ pdfDoc, pageNum, width, onVisible }) {
    const ref        = useRef(null);
    const taskRef    = useRef(null);
    const rendered   = useRef(false);

    useEffect(() => {
        if (!pdfDoc || width < 10) return;
        rendered.current = false;
        let cancelled = false;

        (async () => {
            const page      = await pdfDoc.getPage(pageNum);
            if (cancelled) return;

            const dpr       = window.devicePixelRatio || 1;
            const vp        = page.getViewport({ scale: 1 });

            // Never stretch beyond the page's natural CSS width — only shrink to fit
            const cssWidth  = Math.min(width, vp.width);
            const scale     = (cssWidth / vp.width) * dpr;
            const viewport  = page.getViewport({ scale });

            const canvas    = ref.current;
            if (!canvas || cancelled) return;

            // Physical pixels = viewport size; CSS size = viewport / dpr → crisp
            canvas.width  = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width  = `${viewport.width  / dpr}px`;
            canvas.style.height = `${viewport.height / dpr}px`;

            if (taskRef.current) { taskRef.current.cancel(); }

            taskRef.current = page.render({
                canvasContext: canvas.getContext('2d'),
                viewport,
            });

            try {
                await taskRef.current.promise;
                rendered.current = true;
            } catch (e) {
                if (e?.name !== 'RenderingCancelledException') console.warn('PDF render error', e);
            }
        })();

        return () => {
            cancelled = true;
            taskRef.current?.cancel();
        };
    }, [pdfDoc, pageNum, width]);

    // IntersectionObserver so parent knows which page is in view
    useEffect(() => {
        if (!onVisible || !ref.current) return;
        const io = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) onVisible(pageNum); },
            { threshold: 0.4 },
        );
        io.observe(ref.current);
        return () => io.disconnect();
    }, [pageNum, onVisible]);

    return (
        <div id={`pdf-page-${pageNum}`} className="flex justify-center">
            <canvas
                ref={ref}
                className="block shadow-lg"
                style={{ display: 'block', maxWidth: '100%' }}
            />
        </div>
    );
}

/* ── Main viewer ──────────────────────────────────────────────────────────── */
export default function PdfViewer({ url, title, show, onClose }) {
    const [pdfDoc,   setPdfDoc]   = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [curPage,  setCurPage]  = useState(1);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [width,    setWidth]    = useState(0);

    const scrollRef    = useRef(null);
    const inputRef     = useRef(null);
    const jumpQueued   = useRef(false);

    // Measure scroll container width (runs synchronously after DOM paint)
    useLayoutEffect(() => {
        if (!show) return;
        const el = scrollRef.current;
        if (!el) return;
        const measure = () => setWidth(el.clientWidth - 32); // 16px padding each side
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [show]);

    // Load PDF
    useEffect(() => {
        if (!url || !show) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPdfDoc(null);
        setNumPages(0);

        pdfjsLib.getDocument({ url, withCredentials: true }).promise
            .then(doc => {
                if (cancelled) return;
                const pg = Math.min(Math.max(1, savedPage(url)), doc.numPages);
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setCurPage(pg);
                jumpQueued.current = pg > 1; // scroll to saved page after render
                setLoading(false);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('PDF load error:', err);
                setError('Could not load the PDF. ' + (err?.message || ''));
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [url, show]);

    // Scroll to page after pages have rendered
    useEffect(() => {
        if (!jumpQueued.current || !pdfDoc || curPage < 2) return;
        const el = document.getElementById(`pdf-page-${curPage}`);
        if (el) {
            el.scrollIntoView({ behavior: 'instant' });
            jumpQueued.current = false;
        }
    });

    // Save progress on page change
    useEffect(() => {
        if (url && numPages > 0) persist(url, curPage, numPages);
    }, [url, curPage, numPages]);

    // Keyboard nav
    useEffect(() => {
        if (!show) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && !e.target.matches('input'))
                scrollToPage(p => Math.min(p + 1, numPages));
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && !e.target.matches('input'))
                scrollToPage(p => Math.max(p - 1, 1));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, numPages, onClose]);

    // Reset on close
    useEffect(() => {
        if (!show) { setPdfDoc(null); setNumPages(0); setCurPage(1); }
    }, [show]);

    const scrollToPage = useCallback((updater) => {
        setCurPage(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const el   = document.getElementById(`pdf-page-${next}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            return next;
        });
    }, []);

    const goTo = (raw) => {
        const p = Math.min(Math.max(1, Number(raw) || 1), numPages);
        scrollToPage(p);
    };

    // Track visible page via IntersectionObserver callbacks
    const onPageVisible = useCallback((pageNum) => {
        setCurPage(pageNum);
    }, []);

    if (!show || !url) return null;

    const pct      = numPages > 0 ? Math.round((curPage / numPages) * 100) : 0;
    const barColor = pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#3B82F6';

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* ── Header ── */}
            <div className="flex h-14 shrink-0 items-center gap-x-2 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                    <FaFilePdf size={14} className="text-red-500 dark:text-red-400" />
                </span>

                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </span>

                {numPages > 0 && (
                    <div className="flex shrink-0 items-center gap-x-1">
                        <button type="button" onClick={() => goTo(curPage - 1)} disabled={curPage <= 1}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700">
                            <FaChevronLeft size={11} />
                        </button>

                        <div className="flex items-center gap-x-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                            <input
                                ref={inputRef}
                                type="number" min={1} max={numPages}
                                value={curPage}
                                onChange={e => goTo(e.target.value)}
                                className="w-9 bg-transparent text-center text-xs font-bold text-gray-800 outline-none dark:text-gray-100"
                            />
                            <span className="text-xs text-gray-400">/</span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{numPages}</span>
                        </div>

                        <button type="button" onClick={() => goTo(curPage + 1)} disabled={curPage >= numPages}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700">
                            <FaChevronRight size={11} />
                        </button>

                        <span className="ms-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                            style={{ backgroundColor: barColor }}>
                            {pct}%
                        </span>
                    </div>
                )}

                <a href={url} target="_blank" rel="noreferrer"
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Open in new tab">
                    <FaExternalLinkAlt size={12} />
                </a>

                <button type="button" onClick={onClose}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    title="Close (Esc)">
                    <FaTimes size={14} />
                </button>
            </div>

            {/* ── Progress bar ── */}
            {numPages > 0 && (
                <div className="h-1 w-full shrink-0 bg-gray-100 dark:bg-gray-700">
                    <div className="h-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
            )}

            {/* ── Scrollable pages ── */}
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 px-4 py-6 dark:bg-gray-950"
                style={{ scrollSnapType: 'y mandatory' }}
            >
                {loading && (
                    <div className="flex h-64 items-center justify-center">
                        <svg className="h-9 w-9 animate-spin text-[#007BFF]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                    </div>
                )}

                {error && (
                    <div className="flex h-64 flex-col items-center justify-center gap-y-3 text-center">
                        <p className="text-sm font-semibold text-red-500">{error}</p>
                        <a href={url} target="_blank" rel="noreferrer"
                            className="text-xs text-[#007BFF] underline">
                            Open directly in browser
                        </a>
                    </div>
                )}

                {pdfDoc && width > 0 && (
                    <div className="mx-auto flex max-w-5xl flex-col gap-y-6">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                            <div
                                key={`${url}-${n}`}
                                style={{ scrollSnapAlign: 'start', scrollMarginTop: '8px' }}
                            >
                                <PdfCanvas
                                    pdfDoc={pdfDoc}
                                    pageNum={n}
                                    width={width}
                                    onVisible={onPageVisible}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── PdfProgressBar ───────────────────────────────────────────────────────── */
export function PdfProgressBar({ url, label, onClick }) {
    const readPct = () => {
        try {
            const e = readAll()[url];
            if (!e) return null;
            if (e.scrollPct !== undefined) return e.scrollPct;
            if (e.page && e.total > 0) return Math.round((e.page / e.total) * 100);
        } catch { /* */ }
        return null;
    };

    const [pct, setPct] = useState(readPct);

    useEffect(() => {
        const onStorage = (e) => { if (e.key === PDF_STORAGE_KEY) setPct(readPct()); };
        const onUpdate  = () => setPct(readPct());
        window.addEventListener('storage', onStorage);
        window.addEventListener('pdf-progress-update', onUpdate);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('pdf-progress-update', onUpdate);
        };
    }, [url]);

    const color =
        pct === null ? '#9CA3AF' :
        pct >= 100   ? '#10B981' :
        pct >= 70    ? '#F59E0B' :
                       '#3B82F6';

    return (
        <button type="button" onClick={onClick}
            className="group flex flex-1 flex-col gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-start transition hover:border-[#007BFF]/40 hover:bg-[#007BFF]/5 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-[#00AEEF]/40 dark:hover:bg-[#00AEEF]/10"
        >
            <div className="flex items-center justify-between gap-x-1">
                <span className="flex items-center gap-x-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    <FaFilePdf size={9} className="text-red-400" /> {label}
                </span>
                <span className="text-[11px] font-bold" style={{ color }}>
                    {pct !== null ? `${pct}%` : '—'}
                </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: pct !== null ? `${pct}%` : '0%', backgroundColor: color }} />
            </div>
        </button>
    );
}
