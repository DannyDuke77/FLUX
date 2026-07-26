const Badge = ({ children, variant, className = "" }: { children: React.ReactNode; variant: string; className?: string }) => {
    const variants: Record<string, string> = {
        // Status variants
        open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        closed: "bg-gray-500/15 text-gray-300 border-gray-500/30",
        resolved: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        high: "bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        critical: "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
    };
    
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant.toLowerCase()] || variants.closed} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;