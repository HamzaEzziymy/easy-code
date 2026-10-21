const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-14 w-14 text-lg',
    lg: 'h-28 w-28 text-3xl',
};

export default function StudentAvatar({ photoUrl, name = '', variant = 'sm', className = '' }) {
    const shape = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#007BFF] to-[#00AEEF] font-semibold text-white ${sizes[variant]} ${className}`;

    if (photoUrl) {
        return <img src={photoUrl} alt="" className={`${shape} object-cover`} />;
    }

    return <span className={shape}>{name.charAt(0).toUpperCase() || '—'}</span>;
}
