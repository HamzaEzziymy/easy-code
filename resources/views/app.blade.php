<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- Applied language + direction before first paint, so Arabic never renders LTR for a frame --}}
        <script>
            (function () {
                var supported = ['en', 'fr', 'ar'];
                var locale = null;
                try {
                    locale = localStorage.getItem('app.locale');
                    if (supported.indexOf(locale) === -1) {
                        var match = document.cookie.match(/(?:^|;\s*)app_locale=([^;]*)/);
                        locale = match ? decodeURIComponent(match[1]) : (navigator.language || 'en').slice(0, 2).toLowerCase();
                    }
                } catch (error) {
                    locale = 'en';
                }
                if (supported.indexOf(locale) === -1) {
                    locale = 'en';
                }
                document.documentElement.lang = locale;
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
            })();
        </script>

        {{-- icon --}}
        <link rel="icon" type="image/png" href="/icon_br.png"/>
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600|cairo:400,500,600,700" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
