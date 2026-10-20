import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function GuestLayout({ children }) {
    const { t } = useTranslation();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return (
        <div className="relative flex min-h-screen">
            <div className="fixed top-4 end-4 z-20 rounded-lg bg-white/70 shadow-sm dark:bg-gray-800/70">
                <LanguageSwitcher />
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-white dark:bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 start-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 end-20 w-96 h-96 bg-[#FFC107] rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                    <ApplicationLogo
                        logo_img="/logo_br.png"
                        className="mx-auto h-52 w-auto max-w-full"
                    />
                    <h1 className="text-5xl text-gray-800 dark:text-blue-50 font-bold mb-4 text-center">
                        {t('guest.heading')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-blue-100 text-center max-w-md">
                        {t('guest.subheading')}
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                {children}
            </div>
        </div>
    );
}
