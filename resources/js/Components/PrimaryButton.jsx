export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-[#007BFF] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#0069d9] focus:bg-[#0069d9] focus:outline-none focus:ring-2 focus:ring-[#007BFF]/40 active:bg-[#0056b3] dark:bg-[#00AEEF] dark:text-gray-900 dark:hover:bg-[#22c1f7] dark:focus:bg-[#22c1f7] dark:active:bg-[#0096cf] ${
                    disabled && 'opacity-40'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
