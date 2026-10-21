import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function StudentLogin() {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        login_code: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('student.login.store'));
    };

    return (
        <GuestLayout>
            <Head title={t('studentLogin.title')} />

            <div className="w-full max-w-md">
                <div className="lg:hidden text-center">
                    <Link href="/">
                        <ApplicationLogo
                            logo_img="/logo_name_br.png"
                            className="mx-auto mb-5 h-16 w-auto"
                        />
                    </Link>
                    <h2 className="text-2xl m-8 font-bold text-gray-800 dark:text-white">
                        {t('studentLogin.heading')}
                    </h2>
                </div>

                <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 p-8">
                    <h2 className="hidden lg:block text-2xl font-bold text-gray-800 dark:text-white mb-1">
                        {t('studentLogin.heading')}
                    </h2>
                    <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                        {t('studentLogin.codeHelp')}
                    </p>

                    <form onSubmit={submit}>
                        <div className="mb-6">
                            <InputLabel
                                htmlFor="login_code"
                                value={t('studentLogin.code')}
                                className="text-[#007BFF] dark:text-[#FFC107] font-medium"
                            />
                            <TextInput
                                id="login_code"
                                name="login_code"
                                type="text"
                                value={data.login_code}
                                className="mt-2 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm font-mono tracking-widest uppercase text-center focus:border-[#007BFF] dark:focus:border-[#00AEEF] focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                autoComplete="username"
                                autoFocus
                                isFocused
                                onChange={(e) => setData('login_code', e.target.value.toUpperCase())}
                            />
                            <InputError message={errors.login_code} className="mt-2" />
                        </div>

                        <PrimaryButton
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#007BFF] to-[#00AEEF] hover:from-[#0056b3] hover:to-[#008ECC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
                            disabled={processing}
                        >
                            {processing ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2"></div>
                                    {t('studentLogin.signingIn')}
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span>{t('studentLogin.submit')}</span>
                                    <svg className="w-4 h-4 ms-2 rtl:-scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}
                        </PrimaryButton>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
