import React from 'react'
import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {FaHome, FaLayerGroup, FaPaperclip, FaProjectDiagram, FaTasks, FaUser, FaUsers, FaUserGraduate } from 'react-icons/fa';
import { IoDocumentsSharp } from "react-icons/io5";
import { MdAccountTree } from "react-icons/md";
import { useTranslation } from 'react-i18next';


function Sidebar({sidebarOpen, setSidebarOpen, mobileMenuOpen, setMobileMenuOpen}) {
    const { t } = useTranslation();

    // Navigation items
    const navigation = [
        {
            key: 'dashboard',
            label: t('common.dashboard'),
            icon: <FaHome size={20} />,
            href: route('dashboard'),
            current: route().current('dashboard'),
        },
        { key: 'users', label: t('nav.users'),icon:<FaUsers size={20}/>, href: route('users.index'), current: route().current('users.*') },
        { key: 'students', label: t('nav.students'),icon:<FaUserGraduate size={20}/>, href: route('students.index'), current: route().current('students.*') },
        { key: 'categories', label: t('nav.categories'),icon:<FaLayerGroup size={20}/>, href: route('categories.index'), current: route().current('categories.*') },
        { key: 'structure', label: t('nav.structure'),icon:<MdAccountTree size={20}/>, href: '#', current: false },
        { key: 'projects', label: t('nav.projects'),icon:<FaProjectDiagram size={20}/>, href: '#', current: false },
        { key: 'tasks', label: t('nav.tasks'),icon:<FaTasks size={20}/>, href: '#', current: false },
        { key: 'reports', label: t('nav.reports'),icon:<FaPaperclip size={20}/>, href: '#', current: false },
        { key: 'profile', label: t('nav.profile'),icon:<FaUser size={20}/>, href: route('profile.edit'), current: route().current('profile.edit') },
    ];

  const watermark = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none justify-center pb-6">
      <img src="/logo_br.png" alt="" className="w-40 max-w-[70%] opacity-[0.12] dark:opacity-[0.16]" />
    </div>
  );

  return (
    <>
        {/* Sidebar for mobile */}
        <div className={`fixed inset-y-0 start-0 z-50 w-64 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}>
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                <ApplicationLogo logo_img="/logo_name_br.png" className="h-9 w-auto" />
                <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <nav className="relative mt-5 space-y-1 px-3">
                {navigation.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            item.current
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`}
                    >
                        {item.icon && <span className="me-3">{item.icon}</span>}
                        {item.label}
                    </Link>
                ))}
            </nav>
            {watermark}
        </div>

        {/* Sidebar for desktop */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
            sidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-e border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    {sidebarOpen && (
                        <ApplicationLogo logo_img="/logo_name_br.png" className="h-9 w-auto" />
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
                        </svg>
                    </button>
                </div>
                <nav className="relative flex flex-1 flex-col px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => (
                            <li key={item.key}>
                                <Link
                                    href={item.href}
                                    className={`group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        item.current
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                    }`}
                                    title={!sidebarOpen ? item.label : ''}
                                >
                                    <span className={`${!sidebarOpen && 'mx-auto'}`}>
                                        {item.icon}
                                    </span>
                                    {sidebarOpen && <span>{item.label}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                {watermark}
            </div>
        </div>
    </>
  )
}

export default Sidebar
