'use client';

import Modal from "./Modal";
import { Clock, User, Building2, AlertCircle, FileText, MoveRight, Info, History, Hash, Calendar } from "lucide-react";
import useTicketDetailModal from "@/app/hooks/useTicketDetailModal";
import { useState } from "react";

// Enhanced Badge with more variants and better styling
const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
    const variants: Record<string, string> = {
        open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        closed: "bg-gray-500/15 text-gray-300 border-gray-500/30",
        resolved: "bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
        high: "bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
        low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        critical: "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
    };
    
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${variants[variant.toLowerCase()] || variants.closed}`}>
            {children}
        </span>
    );
};

export const formatDateTime = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric", 
        month: "short", 
        year: "numeric",
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true,
    }).format(date);
};

const DetailModal = () => {
    const { ticket, isOpen, close } = useTicketDetailModal();
    const [currentTab, setCurrentTab] = useState<'details' | 'logs'>('details');

    const TabButton = ({ id, label, icon: Icon, count }: { id: 'details' | 'logs', label: string, icon: any, count?: number }) => (
        <button
            onClick={() => setCurrentTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative group ${
                currentTab === id 
                ? "text-blue-400 border-b-2 border-blue-400 bg-gradient-to-t from-blue-500/5 to-transparent" 
                : "text-gray-500 hover:text-gray-300"
            }`}
        >
            <Icon size={16} className={currentTab === id ? "text-blue-400" : "group-hover:text-gray-300"} />
            {label}
            {count !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    currentTab === id 
                    ? "bg-blue-500/20 text-blue-300" 
                    : "bg-gray-800 text-gray-400"
                }`}>
                    {count}
                </span>
            )}
        </button>
    );

    // Counter for results
    const logCount = ticket?.status_logs?.length || 0;

    const content = (
        <div className="space-y-6">
            {/* Header with Ticket Number Badge */}
            <div className="flex items-center justify-between -mt-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Hash className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Ticket ID</p>
                        <p className="text-sm font-mono text-gray-300">#{ticket?.ticket_number || '---'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={ticket?.status || 'open'}>{ticket?.status?.toUpperCase().replace('_', ' ')}</Badge>
                    <Badge variant={ticket?.priority || 'low'}>{ticket?.priority?.toUpperCase()} PRIORITY</Badge>
                </div>
            </div>

            {/* Tab Navigation with counter */}
            <div className="flex border-b border-gray-800/60 -mx-6 px-6">
                <TabButton id="details" label="Details" icon={Info} />
                <TabButton id="logs" label="Activity Logs" icon={History} count={logCount} />
            </div>

            {currentTab === 'details' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Title Section */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-5 rounded-xl border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{ticket?.title}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar size={14} className="text-gray-600" />
                            Created {formatDateTime(ticket?.created_at)}
                        </p>
                    </div>

                    {/* Description Section - Enhanced */}
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 bg-gray-800/50 border-b border-gray-700/50">
                            <FileText size={16} className="text-blue-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Description</span>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {ticket?.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Meta Grid - Enhanced Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Assignment Flow Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <Building2 className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Flow</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-200 font-medium">{ticket?.department_name}</span> 
                                <MoveRight size={14} className="text-gray-600" /> 
                                <span className="text-gray-200 font-medium">{ticket?.assigned_to_dept_name}</span>
                            </div>
                        </div>

                        {/* Raised By Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                                    <User className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Raised By</p>
                            </div>
                            <p className="text-gray-200 text-sm font-medium">{ticket?.created_by_name}</p>
                        </div>

                        {/* Created On Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</p>
                            </div>
                            <p className="text-gray-200 text-sm font-medium">{formatDateTime(ticket?.created_at)}</p>
                        </div>

                        {/* Reference ID Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-gray-500/10 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reference ID</p>
                            </div>
                            <p className="text-xs font-mono text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50 truncate">
                                {ticket?.id}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Results counter */}
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            Showing <span className="text-white font-medium">{logCount}</span> activity {logCount === 1 ? 'log' : 'logs'}
                        </p>
                        {logCount > 0 && (
                            <span className="text-xs text-gray-500">
                                Sorted by most recent
                            </span>
                        )}
                    </div>

                    {logCount > 0 ? (
                        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-800/50 border-b border-gray-700/50">
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Change</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Changed By</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {ticket?.status_logs?.map((log, index) => (
                                        <tr key={index} className="hover:bg-gray-700/20 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={log.old_status}>{log.old_status.toUpperCase()}</Badge>
                                                    <MoveRight size={14} className="text-gray-600 group-hover:text-gray-500 transition-colors" />
                                                    <Badge variant={log.new_status}>{log.new_status.toUpperCase()}</Badge>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-300">
                                                            {log.changed_by_name?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-300">{log.changed_by_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-400 font-mono">
                                                {formatDateTime(log.changed_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center bg-gray-800/20 rounded-xl border border-gray-700/50 border-dashed">
                            <History className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm font-medium">No activity logs recorded yet</p>
                            <p className="text-gray-600 text-xs mt-1">Status changes will appear here</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <Modal 
            label="Ticket Details"
            isOpen={isOpen}
            close={close}
            content={content}
        />
    );
};

export default DetailModal;