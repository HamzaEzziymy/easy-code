<?php

namespace App\Support;

class Digits
{
    /**
     * An Arabic or Persian keyboard layout hands back ١٢٣ / ۱۲۳, which every other part
     * of the app — validation, hashes, storage — reads as noise.
     */
    public static function latin(string $value): string
    {
        return preg_replace_callback(
            '/[\x{0660}-\x{0669}\x{06F0}-\x{06F9}]/u',
            function (array $digit): string {
                $ordinal = mb_ord($digit[0], 'UTF-8');

                return chr(48 + $ordinal - ($ordinal >= 0x06f0 ? 0x06f0 : 0x0660));
            },
            $value
        ) ?? $value;
    }
}
