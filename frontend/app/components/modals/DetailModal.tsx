'use client';

import Modal from "./Modal";
import { Clock, User, Building2, AlertCircle, FileText, MoveRight, Info, History, Hash, Calendar, ChevronRight } from "lucide-react";
import useTicketDetailModal from "@/app/hooks/useTicketDetailModal";
import { useState } from "react";
import apiService from "@/app/services/apiService";

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
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${variants[variant.toLowerCase()] || variants.closed}`}>
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

// Mobile-friendly card for activity logs
const MobileActivityCard = ({ log }: { log: any }) => (
    <div className="sm:hidden bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-300">
                        {log.changed_by_name?.charAt(0) || '?'}
                    </span>
                </div>
                <span className="text-sm text-gray-300">{log.changed_by_name}</span>
            </div>
            <span className="text-xs text-gray-500">
                {formatDateTime(log.changed_at)}
            </span>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <Badge variant={log.old_status}>
                    {log.old_status.toUpperCase()}
                </Badge>
            </div>
            <ChevronRight size={16} className="text-gray-600 mx-2" />
            <div className="flex-1 text-right">
                <Badge variant={log.new_status}>
                    {log.new_status.toUpperCase()}
                </Badge>
            </div>
        </div>
    </div>
);

const DetailModal = () => {
    const { ticket, isOpen, close } = useTicketDetailModal();
    const [currentTab, setCurrentTab] = useState<'details' | 'logs'>('details');

    const downloadTicketDetailPDF = async (ticketId: string, ticketNumber: string) => {
        try {
            const blob = await apiService.getBlob(`/api/tickets/${ticketId}/export_detail_pdf/`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ticket_${ticketNumber}_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export ticket PDF:", error);
            throw error;
        }
    }

    const TabButton = ({ id, label, icon: Icon, count }: { id: 'details' | 'logs', label: string, icon: any, count?: number }) => (
        <button
            onClick={() => setCurrentTab(id)}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all relative group flex-1 sm:flex-none justify-center ${
                currentTab === id 
                ? "text-blue-400 border-b-2 border-blue-400 bg-gradient-to-t from-blue-500/5 to-transparent" 
                : "text-gray-500 hover:text-gray-300"
            }`}
        >
            <Icon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">{label}</span>
            {count !== undefined && count > 0 && (
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

    const logCount = ticket?.status_logs?.length || 0;

    const content = (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 -mt-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
                        <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Ticket ID</p>
                        <p className="text-xs sm:text-sm font-mono text-gray-300">#{ticket?.ticket_number || '---'}</p>
                    </div>
                </div>
                
                {/* Status and Priority Badges Row - Mobile */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-2 items-center">
                        <Badge variant={ticket?.status || 'open'}>
                            {ticket?.status?.toUpperCase().replace('_', ' ')}
                        </Badge>
                        
                        <Badge variant={ticket?.priority || 'low'}>
                            {ticket?.priority?.toUpperCase()} PRIORITY
                        </Badge>
                    </div>

                    <button 
                        onClick={() => downloadTicketDetailPDF(ticket?.id!, ticket?.ticket_number!)} 
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 bg-gray-800 font-semibold rounded-md shadow-sm transition-all hover:bg-gray-800 active:scale-95 group ml-auto sm:ml-0"
                        title="Download Ticket Report"
                    >
                        <FileText size={14} className="sm:w-[18px] sm:h-[18px] text-slate-500 group-hover:text-blue-600 transition-colors" />
                        <span className="hidden xs:inline">Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Tabs - Mobile Scrollable */}
            <div className="flex border-b border-gray-800/60 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-full sm:min-w-0">
                    <TabButton id="details" label="Details" icon={Info} />
                    <TabButton id="logs" label="Activity" icon={History} count={logCount} />
                </div>
            </div>

            {currentTab === 'details' ? (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Title Section - Mobile Optimized */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-4 sm:p-5 rounded-xl border border-gray-700/50">
                        <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2 tracking-tight line-clamp-2">{ticket?.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                            <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-gray-600" />
                            Created {formatDateTime(ticket?.created_at)}
                        </p>
                    </div>

                    {/* Description - Mobile Optimized */}
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-gray-800/50 border-b border-gray-700/50">
                            <FileText size={14} className="sm:w-4 sm:h-4 text-blue-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Description</span>
                        </div>
                        <div className="p-4 sm:p-5">
                            <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                                {ticket?.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Info Cards - Mobile Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Assignment Flow Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-3 sm:p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1 sm:p-1.5 bg-blue-500/10 rounded-lg">
                                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</p>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                                <span className="text-gray-200 font-medium truncate max-w-[80px] sm:max-w-none">{ticket?.department_name}</span> 
                                <MoveRight size={10} className="sm:w-[14px] sm:h-[14px] text-gray-600 flex-shrink-0" /> 
                                <span className="text-gray-200 font-medium truncate max-w-[80px] sm:max-w-none">{ticket?.assigned_to_dept_name}</span>
                            </div>
                        </div>

                        {/* Raised By Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-3 sm:p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1 sm:p-1.5 bg-purple-500/10 rounded-lg">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Raised By</p>
                            </div>
                            <p className="text-gray-200 text-xs sm:text-sm font-medium truncate">{ticket?.created_by_name}</p>
                        </div>

                        {/* Created On Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-3 sm:p-5 hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1 sm:p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                            </div>
                            <p className="text-gray-200 text-xs sm:text-sm font-medium line-clamp-1">{formatDateTime(ticket?.created_at)}</p>
                        </div>

                        {/* Reference ID Card */}
                        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-3 sm:p-5 hover:border-gray-600/50 transition-colors col-span-1">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1 sm:p-1.5 bg-gray-500/10 rounded-lg">
                                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ref ID</p>
                            </div>
                            <p className="text-xs font-mono text-gray-400 bg-gray-900/50 p-1.5 sm:p-2 rounded border border-gray-700/50 truncate">
                                {ticket?.id}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Logs Header - Mobile Optimized */}
                    <div className="mb-3 sm:mb-4 flex items-center justify-between px-1">
                        <p className="text-xs sm:text-sm text-gray-400">
                            <span className="text-white font-medium">{logCount}</span> activity {logCount === 1 ? 'log' : 'logs'}
                        </p>
                        {logCount > 0 && (
                            <span className="text-xs text-gray-500">
                                Most recent
                            </span>
                        )}
                    </div>

                    {logCount > 0 ? (
                        <>
                            {/* Mobile Card View for Logs */}
                            <div className="sm:hidden">
                                {ticket?.status_logs?.map((log, index) => (
                                    <MobileActivityCard key={index} log={log} />
                                ))}
                            </div>

                            {/* Desktop Table View for Logs */}
                            <div className="hidden sm:block bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
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
                                                        <MoveRight size={14} className="text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                                                        <Badge variant={log.new_status}>{log.new_status.toUpperCase()}</Badge>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-medium text-gray-300">
                                                                {log.changed_by_name?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-300 truncate max-w-[150px]">{log.changed_by_name}</span>
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
                        </>
                    ) : (
                        <div className="py-12 sm:py-16 text-center bg-gray-800/20 rounded-xl border border-gray-700/50 border-dashed">
                            <History className="w-8 h-8 sm:w-12 sm:h-12 text-gray-700 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-xs sm:text-sm font-medium">No activity logs recorded yet</p>
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