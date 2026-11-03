import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaFilePdf } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).toString();

/* ── LocalStorage — keyed by studentId so progress is per-student ────────── */
const STORAGE_BASE = 'pdf_progress';

function storageKey(studentId) {
    return studentId ? `${STORAGE_BASE}_s${studentId}` : STORAGE_BASE;
}

function readAll(studentId) {
    try { return JSON.parse(localStorage.getItem(storageKey(studentId)) || '{}'); } catch { return {}; }
}

function writeLocal(studentId, url, page, total) {
    if (!url || total < 1) return;
    const pct = Math.round((page / total) * 100);
    const all = readAll(studentId);
    all[url] = { page, total, scrollPct: pct };
    localStorage.setItem(storageKey(studentId), JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('pdf-progress-update', { detail: { studentId } }));
}

function savedPageLocal(studentId, url) {
    return readAll(studentId)[url]?.page ?? 1;
}

/* ── DB sync ─────────────────────────────────────────────────────────────── */
function persistToDB(courseId, pdfSlot, page, total) {
    if (!courseId || !pdfSlot || !total) return;
    const pct     = Math.round((page / total) * 100);
    const payload = JSON.stringify({
        course_id:    courseId,
        pdf_slot:     pdfSlot,
        current_page: page,
        total_pages:  total,
        scroll_pct:   pct,
        _token:       document.querySelector('meta[name="csrf-token"]')?.content ?? '',
    });

    if (navigator.sendBeacon) {
        navigator.sendBeacon('/student/pdf-progress', new Blob([payload], { type: 'application/json' }));
    } else {
        fetch('/student/pdf-progress', {
            method:    'POST',
            headers: {
                'Content-Type':     'application/json',
                'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body:      payload,
            keepalive: true,
        }).catch(() => {});
    }
}

/**
 * Called once on Dashboard mount — seeds localStorage from DB data.
 * studentId namespaces the key so different students on the same device
 * never share progress.
 */
export function seedProgressFromServer(studentId, pdfUrl, serverEntry) {
    if (!pdfUrl || !serverEntry) return;
    const all   = readAll(studentId);
    const local = all[pdfUrl];
    if (!local || serverEntry.page > (local.page ?? 0)) {
        all[pdfUrl] = {
            page:      serverEntry.page,
            total:     serverEntry.total,
            scrollPct: serverEntry.scrollPct,
        };
        localStorage.setItem(storageKey(studentId), JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('pdf-progress-update', { detail: { studentId } }));
    }
}

/* ── PdfCanvas ───────────────────────────────────────────────────────────── */
function PdfCanvas({ pdfDoc, pageNum, width, onVisible }) {
    const ref     = useRef(null);
    const taskRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || width < 10) return;
        let cancelled = false;
        (async () => {
            const page     = await pdfDoc.getPage(pageNum);
            if (cancelled) return;
            const dpr      = window.devicePixelRatio || 1;
            const vp       = page.getViewport({ scale: 1 });
            const cssWidth = Math.min(width, vp.width);
            const scale    = (cssWidth / vp.width) * dpr;
            const viewport = page.getViewport({ scale });
            const canvas   = ref.current;
            if (!canvas || cancelled) return;
            canvas.width        = viewport.width;
            canvas.height       = viewport.height;
            canvas.style.width  = `${viewport.width  / dpr}px`;
            canvas.style.height = `${viewport.height / dpr}px`;
            taskRef.current?.cancel();
            taskRef.current = page.render({ canvasContext: canvas.getContext('2d'), viewport });
            try { await taskRef.current.promise; }
            catch (e) { if (e?.name !== 'RenderingCancelledException') console.warn(e); }
        })();
        return () => { cancelled = true; taskRef.current?.cancel(); };
    }, [pdfDoc, pageNum, width]);

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
            <canvas ref={ref} className="block shadow-md" style={{ display: 'block', maxWidth: '100%' }} />
        </div>
    );
}

/* ── Inline PDF Viewer (no full-screen takeover) ────────────────────────── */
/**
 * Renders as a contained panel — caller controls the layout.
 * Props:
 *   url        — PDF URL
 *   title      — display title
 *   typePill   — JSX for the type badge shown in the header
 *   onBack     — back button callback shown in the header
 *   studentId  — for per-student localStorage namespacing
 *   courseId   — for DB persistence
 *   pdfSlot    — 'fr' | 'ar' — for DB persistence
 *   onClose    — alias for onBack (kept for compat)
 */
export default function PdfViewer({ url, title, typePill, onBack, studentId, courseId, pdfSlot, onClose }) {
    const handleBack = onBack ?? onClose;
    const [pdfDoc,   setPdfDoc]   = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [curPage,  setCurPage]  = useState(1);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [width,    setWidth]    = useState(0);

    const scrollRef  = useRef(null);
    const jumpQueued = useRef(false);

    // Measure container width
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const measure = () => setWidth(el.clientWidth - 32);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [url]);

    // Load PDF
    useEffect(() => {
        if (!url) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPdfDoc(null);
        setNumPages(0);

        pdfjsLib.getDocument({ url, withCredentials: true }).promise
            .then(doc => {
                if (cancelled) return;
                const pg = Math.min(Math.max(1, savedPageLocal(studentId, url)), doc.numPages);
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setCurPage(pg);
                jumpQueued.current = pg > 1;
                setLoading(false);
            })
            .catch(err => {
                if (cancelled) return;
                setError('Could not load the PDF. ' + (err?.message || ''));
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, [url, studentId]);

    // Jump to saved page after render
    useEffect(() => {
        if (!jumpQueued.current || !pdfDoc || curPage < 2) return;
        const el = document.getElementById(`pdf-page-${curPage}`);
        if (el) { el.scrollIntoView({ behavior: 'instant' }); jumpQueued.current = false; }
    });

    // Save progress on every page change
    useEffect(() => {
        if (!url || numPages < 1) return;
        writeLocal(studentId, url, curPage, numPages);
        persistToDB(courseId, pdfSlot, curPage, numPages);
    }, [url, curPage, numPages, studentId, courseId, pdfSlot]);

    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
            if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && !e.target.matches('input'))
                goTo(curPage + 1);
            if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && !e.target.matches('input'))
                goTo(curPage - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [curPage, numPages, onClose]);

    const onPageVisible = useCallback((n) => setCurPage(n), []);

    const goTo = (raw) => {
        const p  = Math.min(Math.max(1, Number(raw) || 1), numPages);
        const el = document.getElementById(`pdf-page-${p}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setCurPage(p);
    };

    const pct      = numPages > 0 ? Math.round((curPage / numPages) * 100) : 0;
    const barColor = pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#3B82F6';

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">

            {/* Header — back button + type pill + title + page controls */}
            <div className="flex h-12 shrink-0 items-center gap-x-2 border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">

                {/* Back button */}
                {handleBack && (
                    <button type="button" onClick={handleBack}
                        className="flex shrink-0 items-center gap-x-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        <FaChevronLeft size={9} />
                        <span>رجوع</span>
                    </button>
                )}

                {/* Type pill */}
                {typePill && <span className="shrink-0">{typePill}</span>}

                {/* Title */}
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </span>

                {/* Page controls */}
                {numPages > 0 && (
                    <div className="flex shrink-0 items-center gap-x-1">
                        <button type="button" onClick={() => goTo(curPage - 1)} disabled={curPage <= 1}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700">
                            <FaChevronLeft size={10} />
                        </button>
                        <div className="flex items-center gap-x-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 dark:border-gray-600 dark:bg-gray-700">
                            <input type="number" min={1} max={numPages} value={curPage}
                                onChange={e => goTo(e.target.value)}
                                className="w-7 bg-transparent text-center text-[11px] font-bold text-gray-800 outline-none dark:text-gray-100"
                            />
                            <span className="text-[11px] text-gray-400">/ {numPages}</span>
                        </div>
                        <button type="button" onClick={() => goTo(curPage + 1)} disabled={curPage >= numPages}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700">
                            <FaChevronRight size={10} />
                        </button>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: barColor }}>{pct}%
                        </span>
                    </div>
                )}

                <a href={url} target="_blank" rel="noreferrer"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    title="Open in new tab">
                    <FaExternalLinkAlt size={11} />
                </a>
            </div>

            {/* Progress bar */}
            {numPages > 0 && (
                <div className="h-0.5 w-full shrink-0 bg-gray-100 dark:bg-gray-700">
                    <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
            )}

            {/* Pages */}
            <div ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 px-3 py-4 dark:bg-gray-950"
                style={{ scrollSnapType: 'y mandatory' }}>
                {loading && (
                    <div className="flex h-48 items-center justify-center">
                        <svg className="h-8 w-8 animate-spin text-[#007BFF]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                    </div>
                )}
                {error && (
                    <div className="flex h-48 flex-col items-center justify-center gap-y-2 text-center">
                        <p className="text-sm font-semibold text-red-500">{error}</p>
                        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-[#007BFF] underline">
                            Open directly
                        </a>
                    </div>
                )}
                {pdfDoc && width > 0 && (
                    <div className="mx-auto flex flex-col gap-y-4">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                            <div key={`${url}-${n}`} style={{ scrollSnapAlign: 'start', scrollMarginTop: '4px' }}>
                                <PdfCanvas pdfDoc={pdfDoc} pageNum={n} width={width} onVisible={onPageVisible} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── PdfProgressBar ───────────────────────────────────────────────────────── */
export function PdfProgressBar({ url, label, studentId, onClick }) {
    const readPct = () => {
        try {
            const e = readAll(studentId)[url];
            if (!e) return null;
            if (e.scrollPct !== undefined) return e.scrollPct;
            if (e.page && e.total > 0) return Math.round((e.page / e.total) * 100);
        } catch { }
        return null;
    };

    const [pct, setPct] = useState(readPct);

    useEffect(() => {
        // Cross-tab (storage event) + same-tab (custom event)
        const onStorage = (e) => { if (e.key === storageKey(studentId)) setPct(readPct()); };
        const onUpdate  = (e) => { if (!e.detail?.studentId || e.detail.studentId === studentId) setPct(readPct()); };
        window.addEventListener('storage', onStorage);
        window.addEventListener('pdf-progress-update', onUpdate);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('pdf-progress-update', onUpdate);
        };
    }, [url, studentId]);

    const color = pct === null ? '#9CA3AF' : pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#3B82F6';

    return (
        <button type="button" onClick={onClick}
            className="group flex w-full flex-col gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-start transition hover:border-[#007BFF]/40 hover:bg-[#007BFF]/5 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-[#00AEEF]/40">
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
