// import ApplicationLogo from '@/Components/ApplicationLogo';
// import Checkbox from '@/Components/Checkbox';
// import InputError from '@/Components/InputError';
// import InputLabel from '@/Components/InputLabel';
// import PrimaryButton from '@/Components/PrimaryButton';
// import TextInput from '@/Components/TextInput';
// import GuestLayout from '@/Layouts/GuestLayout';
// import { Head, Link, useForm } from '@inertiajs/react';
// import { useState } from 'react';
// import { FaEye } from 'react-icons/fa';
// import { IoEyeOff } from 'react-icons/io5';

// export default function Login({ status, canResetPassword }) {
//     const { data, setData, post, processing, errors, reset } = useForm({
//         email: '',
//         password: '',
//         remember: false,
//     });

//     const [showPassword, setShowPassword] = useState(false);
//     const submit = (e) => {
//         e.preventDefault();

//         post(route('login'), {
//             onFinish: () => reset('password'),
//         });
//     };

//     return (
//         <GuestLayout>
//             <Head title="Log in" />

//             {status && (
//                 <div className="mb-4 text-sm font-medium text-green-600">
//                     {status}
//                 </div>
//             )}
        
//             <div className="w-full max-w-md">
//                 {/* Mobile Logo */}
//                 <div className="lg:hidden text-center">
//                     <Link href="/">
//                         <ApplicationLogo
//                             logo_img="./logo_name_br.png" 
//                             className="h-16 w-16 fill-current text-[#007BFF] dark:text-[#00AEEF] mx-auto" 
//                         />
//                     </Link>
//                     <h2 className="text-2xl m-8 font-bold text-gray-800 dark:text-white">Welcome Back</h2>
//                 </div>

//                 <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
//                     <form onSubmit={submit}>
//                         <div className="mb-6">
//                             <InputLabel 
//                                 htmlFor="email" 
//                                 value="Email" 
//                                 className="text-gray-700 dark:text-gray-300 font-medium"
//                             />
//                             <TextInput
//                                 id="email"
//                                 type="email"
//                                 name="email"
//                                 value={data.email}
//                                 className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007BFF] focus:ring-[#007BFF] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
//                                 autoComplete="username"
//                                 isFocused={true}
//                                 onChange={(e) => setData('email', e.target.value)}
//                             />
//                             <InputError message={errors.email} className="mt-2" />
//                         </div>

//                         <div className="mb-6">
//                             <InputLabel 
//                                 htmlFor="password" 
//                                 value="Password" 
//                                 className="text-gray-700 dark:text-gray-300 font-medium"
//                             />
//                             <TextInput
//                                 id="password"
//                                 type="password"
//                                 name="password"
//                                 value={data.password}
//                                 className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007BFF] focus:ring-[#007BFF] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
//                                 autoComplete="current-password"
//                                 onChange={(e) => setData('password', e.target.value)}
//                             />
//                             <InputError message={errors.password} className="mt-2" />
//                         </div>

//                         <div className="mb-6 flex items-center justify-between">
//                             <label className="flex items-center">
//                                 <Checkbox
//                                     name="remember"
//                                     checked={data.remember}
//                                     onChange={(e) => setData('remember', e.target.checked)}
//                                     className="rounded border-gray-300 text-[#007BFF] focus:ring-[#007BFF] dark:bg-gray-700 dark:border-gray-600"
//                                 />
//                                 <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
//                                     Remember me
//                                 </span>
//                             </label>

//                             {canResetPassword && (
//                                 <Link
//                                     href={route('password.request')}
//                                     className="text-sm text-[#007BFF] hover:text-[#0056b3] dark:text-[#00AEEF] dark:hover:text-[#008ECC] font-medium transition-colors duration-200"
//                                 >
//                                     Forgot password?
//                                 </Link>
//                             )}
//                         </div>

//                         <PrimaryButton 
//                             className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#007BFF] to-[#00AEEF] hover:from-[#0056b3] hover:to-[#008ECC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
//                             disabled={processing}
//                         >
//                             {processing ? (
//                                 <div className="flex items-center">
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                                     Signing in...
//                                 </div>
//                             ) : (
//                                 <div className="flex items-center">
//                                     <span>Sign in</span>
//                                     <svg className="w-4 h-4 ms-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                                     </svg>
//                                 </div>
//                             )}
//                         </PrimaryButton>
//                     </form>

//                     {/* Additional decorative elements */}
//                     <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
//                         <div className="flex items-center justify-center space-x-4">
//                             <div className="w-2 h-2 bg-[#FFC107] rounded-full"></div>
//                             <div className="w-2 h-2 bg-[#007BFF] rounded-full"></div>
//                             <div className="w-2 h-2 bg-[#00AEEF] rounded-full"></div>
//                             <div className="w-2 h-2 bg-[#FF9800] rounded-full"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//         </GuestLayout>
//     );
// }



import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { IoEyeOff } from 'react-icons/io5';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                    {status}
                </div>
            )}
        
            <div className="w-full max-w-md">
                {/* Mobile Logo */}
                <div className="lg:hidden text-center">
                    <Link href="/">
                        <ApplicationLogo
                            logo_img="./logo_name_br.png" 
                            className="h-16 w-16 fill-current text-[#007BFF] dark:text-[#00AEEF] mx-auto" 
                        />
                    </Link>
                    <h2 className="text-2xl m-8 font-bold text-gray-800 dark:text-white">Welcome Back</h2>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                    <form onSubmit={submit}>
                        <div className="mb-6">
                            <InputLabel 
                                htmlFor="email" 
                                value="Email" 
                                className="text-[#007BFF] dark:text-[#FFC107] font-medium"
                            />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-2 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#007BFF] dark:focus:border-[#00AEEF] focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mb-6">
                            <InputLabel 
                                htmlFor="password" 
                                value="Password" 
                                className="text-[#007BFF] dark:text-[#FFC107] font-medium"
                            />
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="mt-2 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#007BFF] dark:focus:border-[#00AEEF] focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 pr-10"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-[#007BFF] dark:hover:text-[#00AEEF] focus:outline-none transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <IoEyeOff className="w-5 h-5" />
                                    ) : (
                                        <FaEye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-gray-600 text-[#007BFF] dark:text-[#00AEEF] focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] bg-white dark:bg-gray-700"
                                />
                                <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-[#007BFF] hover:text-[#0056b3] dark:text-[#00AEEF] dark:hover:text-[#008ECC] font-medium transition-colors duration-200"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <PrimaryButton 
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#007BFF] to-[#00AEEF] hover:from-[#0056b3] hover:to-[#008ECC] dark:from-[#007BFF] dark:to-[#00AEEF] dark:hover:from-[#0056b3] dark:hover:to-[#008ECC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] dark:focus:ring-[#00AEEF] dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
                            disabled={processing}
                        >
                            {processing ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span>Sign in</span>
                                    <svg className="w-4 h-4 ms-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}
                        </PrimaryButton>
                    </form>

                    {/* Decorative elements with accent colors */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center space-x-4">
                            <div className="w-2 h-2 bg-[#FFC107] dark:bg-[#FFC107] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-[#007BFF] dark:bg-[#007BFF] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-[#00AEEF] dark:bg-[#00AEEF] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            <div className="w-2 h-2 bg-[#FF9800] dark:bg-[#FF9800] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        </div>
                    </div>
                </div>
            </div>

        </GuestLayout>
    );
}