import ApplicationLogo from '@/Components/ApplicationLogo';
import { useEffect } from 'react';

export default function GuestLayout({ children }) {
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);
    return (
        <div className="flex min-h-screen">
            <div className="hidden lg:flex lg:w-1/2 bg-white dark:bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#FFC107] rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                    <ApplicationLogo
                        logo_img="./logo_br.png" 
                        className="h-16 w-16 fill-current text-[#007BFF] dark:text-[#0048ff] mx-auto" 
                    />
                    <h1 className="text-5xl text-gray-800 dark:text-blue-50 font-bold mb-4 text-center">
                        Welcome Back
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-blue-100 text-center max-w-md">
                        Continue your learning journey with us. Knowledge is the key to success.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                {children}
            </div>
        </div>
    );
}


