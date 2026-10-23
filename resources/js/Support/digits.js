const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

/**
 * An Arabic keyboard sends ١٢ or ۱۲ for digits, and every code in this app is Latin — this is the
 * client twin of the server's Digits::latin(), so a typed code is compared the way it was stored.
 */
export const toLatinDigits = (value) =>
    String(value).replace(ARABIC_DIGITS, (digit) => {
        const code = digit.charCodeAt(0);

        return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
    });
