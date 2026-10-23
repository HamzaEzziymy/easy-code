import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { toLatinDigits } from '@/Support/digits';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The identifier has to be typed before the button unlocks, so a deletion cannot be finished by
 * reflex. Compared the way the code was stored: an Arabic keyboard sends ١٢, and nobody holds
 * shift for a code like EC-2026-0001.
 */
export default function TypeToConfirm({
    open,
    expected,
    label,
    placeholder,
    onCancel,
    onConfirm,
    busy = false
}) {
    const { t } = useTranslation();
    const [typed, setTyped] = useState('');

    // A closed modal is hidden rather than unmounted, so the half-typed code goes with it.
    useEffect(() => {
        if (!open) {
            setTyped('');
        }
    }, [open]);

    const fold = (value) => toLatinDigits(String(value)).replace(/\s/g, '').toUpperCase();
    const matched = Boolean(expected) && fold(typed) === fold(expected);

    // The typed code stays put while the delete is in flight; the effect above empties it
    // once the modal closes, so reopening always starts from a blank box.
    const confirm = () => {
        if (!busy) {
            onConfirm();
        }
    };

    return (
        <div className="space-y-4">
            <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                <input
                    dir="ltr"
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && matched) {
                            event.preventDefault();
                            confirm();
                        }
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className={`mt-1.5 block w-full rounded-xl border-2 bg-white px-3 py-2.5 font-mono text-sm tracking-wide text-gray-800 outline-none transition placeholder:text-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                        matched
                            ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/25'
                            : 'border-gray-300 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 dark:border-gray-600'
                    }`}
                />
            </label>

            <div className="flex justify-end gap-x-3">
                <SecondaryButton onClick={onCancel}>{t('common.cancel')}</SecondaryButton>
                <DangerButton disabled={!matched || busy} onClick={confirm}>
                    {t('common.confirm')}
                </DangerButton>
            </div>
        </div>
    );
}
