const PriorityBadge = ({ priority }: { priority: string }) => {
    const priorityConfig = {
        critical: { color: "bg-rose-500", letter: "C", label: "Critical" },
        high: { color: "bg-red-500", letter: "H", label: "High" },
        medium: { color: "bg-yellow-500", letter: "M", label: "Medium" },
        low: { color: "bg-blue-500", letter: "L", label: "Low" }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
        <>
            {/* Mobile: Single letter with color */}
            <div className="sm:hidden flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                    {config.letter}
                </div>
            </div>
            {/* Desktop: Full text with dot */}
            <div className="hidden sm:flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                    priority === 'critical' ? 'bg-rose-500 animate-pulse' :
                    priority === 'high' ? 'bg-red-500 animate-pulse' : 
                    priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm text-gray-300 capitalize">{priority}</span>
            </div>
        </>
    );
};

export default PriorityBadge;