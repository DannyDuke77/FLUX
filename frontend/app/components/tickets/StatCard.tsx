const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend?: string; color: string }) => (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600/50 transition-all group">
        <div className="flex items-center justify-between mb-3">
            <div className={`p-2 ${color}/10 rounded-xl border border-${color}/20`}>
                <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
            {trend && <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default StatCard;