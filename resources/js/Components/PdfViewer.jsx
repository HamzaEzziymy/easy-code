import { useEffect, useRef, useState, useCallback } from 'react';
import { FaTimes, FaExternalLinkAlt, FaFilePdf } from 'react-icons/fa';

/* ── LocalStorage helpers (shared with CategoryDashboard) ─────────────────── */
const PDF_STORAGE_KEY = 'pdf_progress';

function readAllProgress() {
    try { return JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}'); } catch { return {}; }
}

function persistProgress(url, pct) {
    if (!url) return;
    const all = readAllProgress();
    // Store as { scrollPct } so it co-exists with the manual page tracker
    all[url] = { ...(all[url] || {}), scrollPct: pct };
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(all));
    // Notify same-tab listeners (storage events don't fire for same-tab writes)
    window.dispatchEvent(new Event('pdf-progress-update'));
}

function loadScrollPct(url) {
    if (!url) return 0;
    return readAllProgress()[url]?.scrollPct ?? 0;
}

/* ── Component ────────────────────────────────────────────────────────────── */

/**
 * PdfViewer
 *
 * A full-screen overlay that embeds a same-origin PDF inside an <iframe>
 * and automatically tracks reading progress via scroll position.
 * Progress is persisted to localStorage and restored on re-open.
 *
 * Props:
 *   url     – absolute URL of the PDF (must be same-origin)
 *   title   – label shown in the header bar
 *   show    – boolean visibility flag
 *   onClose – callback to close the viewer
 */
export default function PdfViewer({ url, title, show, onClose }) {
    const iframeRef  = useRef(null);
    const [progress, setProgress] = useState(0);   // 0–100
    const [loaded,   setLoaded]   = useState(false);
    const cleanupRef = useRef(null);

    // ── Restore saved progress when URL changes ───────────────────────────────
    useEffect(() => {
        setProgress(loadScrollPct(url));
        setLoaded(false);
    }, [url]);

    // ── Attach scroll tracking after the iframe loads ──────────────────────────
    const handleLoad = useCallback(() => {
        setLoaded(true);

        const iframe = iframeRef.current;
        if (!iframe) return;

        // Clean up previous listeners before attaching new ones
        if (cleanupRef.current) cleanupRef.current();

        const attach = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                const win = iframe.contentWindow;
                if (!doc || !win) return;

                const compute = () => {
                    // Works for both the browser's native PDF renderer and HTML docs
                    const el      = doc.scrollingElement || doc.documentElement || doc.body;
                    const scrolled = el?.scrollTop  ?? win.scrollY  ?? 0;
                    const total    = (el?.scrollHeight ?? doc.body?.scrollHeight ?? 1)
                                   - (el?.clientHeight ?? win.innerHeight ?? 1);

                    if (total <= 0) {
                        setProgress(100);
                        persistProgress(url, 100);
                        return;
                    }
                    const pct = Math.min(100, Math.round((scrolled / total) * 100));
                    setProgress(pct);
                    persistProgress(url, pct);
                };

                win.addEventListener('scroll', compute, { passive: true });

                // PDF.js renders asynchronously — re-poll after short delays
                const timers = [
                    setTimeout(compute, 400),
                    setTimeout(compute, 1200),
                    setTimeout(compute, 3000),
                ];

                // Catch layout shifts while pages render (PDF.js)
                let observer = null;
                try {
                    observer = new MutationObserver(compute);
                    observer.observe(doc.body || doc.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: false,
                    });
                } catch { /* ignore */ }

                compute();

                cleanupRef.current = () => {
                    win.removeEventListener('scroll', compute);
                    observer?.disconnect();
                    timers.forEach(clearTimeout);
                };
            } catch {
                // Cross-origin PDF – automatic tracking unavailable
                setProgress(loadScrollPct(url));
            }
        };

        const timer = setTimeout(attach, 150);
        return () => clearTimeout(timer);
    }, [url]);

    // ── Reset on close ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!show) {
            if (cleanupRef.current) cleanupRef.current();
            setLoaded(false);
        }
    }, [show]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => () => { if (cleanupRef.current) cleanupRef.current(); }, []);

    // ── Close on Escape ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!show) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [show, onClose]);

    if (!show || !url) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col bg-gray-950/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="relative flex h-14 shrink-0 items-center gap-x-3 bg-white px-4 shadow-md dark:bg-gray-800">

                {/* PDF icon */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                    <FaFilePdf size={14} className="text-red-500 dark:text-red-400" />
                </span>

                {/* Title */}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </span>

                {/* Open in new tab */}
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title="Open in new tab"
                >
                    <FaExternalLinkAlt size={13} />
                </a>

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    title="Close (Esc)"
                >
                    <FaTimes size={14} />
                </button>
            </div>

            {/* ── PDF iframe ───────────────────────────────────────────────── */}
            <div className="relative min-h-0 flex-1">
                {/* Loading spinner */}
                {!loaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-gray-100 dark:bg-gray-900">
                        <svg
                            className="h-8 w-8 animate-spin text-[#007BFF]"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12" cy="12" r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading PDF…</p>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    src={url}
                    title={title}
                    onLoad={handleLoad}
                    className="h-full w-full border-0"
                    style={{ display: 'block', minHeight: '100%' }}
                />
            </div>
        </div>
    );
}

/**
 * PdfProgressBar
 *
 * A compact clickable card that shows the scroll-based reading progress for
 * a single PDF URL. Updates live while the PdfViewer is open (same tab).
 *
 * Props:
 *   url    – PDF URL (key into localStorage)
 *   label  – display label, e.g. "FR" or "AR"
 *   onClick – called when the user clicks to open the viewer
 */
export function PdfProgressBar({ url, label, onClick }) {
    const readPct = () => {
        try {
            const entry = readAllProgress()[url];
            if (!entry) return null;
            if (entry.scrollPct !== undefined) return entry.scrollPct;
            if (entry.page && entry.total > 0) return Math.round((entry.page / entry.total) * 100);
        } catch { /* ignore */ }
        return null;
    };

    const [pct, setPct] = useState(readPct);

    // Cross-tab updates
    useEffect(() => {
        const handler = (e) => { if (e.key === PDF_STORAGE_KEY) setPct(readPct()); };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, [url]);

    // Same-tab updates (dispatched by persistProgress / persistScrollPct)
    useEffect(() => {
        const handler = () => setPct(readPct());
        window.addEventListener('pdf-progress-update', handler);
        return () => window.removeEventListener('pdf-progress-update', handler);
    }, [url]);

    const barColor =
        pct === null ? '#9CA3AF' :   // gray — never opened
        pct >= 100   ? '#10B981' :   // green — finished
        pct >= 70    ? '#F59E0B' :   // amber
                       '#3B82F6';    // blue

    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex flex-1 flex-col gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-start transition hover:border-[#007BFF]/40 hover:bg-[#007BFF]/5 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-[#00AEEF]/40 dark:hover:bg-[#00AEEF]/10"
        >
            <div className="flex items-center justify-between gap-x-1">
                <span className="flex items-center gap-x-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    <FaFilePdf size={9} className="text-red-400" />
                    {label}
                </span>
                <span className="text-[11px] font-bold" style={{ color: barColor }}>
                    {pct !== null ? `${pct}%` : '—'}
                </span>
            </div>
            {/* Track */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: pct !== null ? `${pct}%` : '0%', backgroundColor: barColor }}
                />
            </div>
        </button>
    );
}
