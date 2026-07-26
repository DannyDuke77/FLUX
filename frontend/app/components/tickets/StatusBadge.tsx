const StatusBadge = ({ status, ticketId, onStatusChange }: { status: string; ticketId: string; onStatusChange: (ticketId: string, newStatus: string) => void }) => {
    const statusConfig = {
        open: { color: "bg-emerald-500", letter: "O", label: "Open" },
        in_progress: { color: "bg-blue-500", letter: "P", label: "In Progress" },
        resolved: { color: "bg-purple-500", letter: "R", label: "Resolved" },
        closed: { color: "bg-gray-500", letter: "C", label: "Closed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
        <>
            {/* Mobile: Single letter with color */}
            <div className="sm:hidden">
                <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                    {config.letter}
                </div>
            </div>
            {/* Desktop: Full select dropdown */}
            <select
                value={status}
                onChange={(e) => onStatusChange(ticketId, e.target.value)}
                disabled={['closed'].includes(status)}
                className={`hidden sm:block px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    status === 'open' ? 'border-emerald-500/30 text-emerald-300' :
                    status === 'in_progress' ? 'border-blue-500/30 text-blue-300' :
                    status === 'resolved' ? 'border-purple-500/30 text-purple-300' :
                    'border-gray-500/30 text-gray-300'
                }`}
            >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
            </select>
        </>
    );
};

export default StatusBadge;