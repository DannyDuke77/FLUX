'use client';

import Image from "next/image";
import Modal from "./Modal";
import { Clock, User, Building2, AlertCircle, FileText, MoveRight, Info, History, Hash, Calendar, ChevronRight, Paperclip, File, Download, X } from "lucide-react";
import useTicketDetailModal from "@/app/hooks/useTicketDetailModal";
import { useState, useMemo, useCallback } from "react";
import apiService from "@/app/services/apiService";
import ViewTicketNoteButton from "../navigation/ViewTicketNoteButton";
import Badge from "../tickets/Badge";

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

// Memoized sub-components
const InfoCard = ({ icon: Icon, iconColor, title, children }: { icon: any; iconColor: string; title: string; children: React.ReactNode }) => (
    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-3 sm:p-5 hover:border-gray-600/50 transition-colors">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className={`p-1 sm:p-1.5 bg-${iconColor}-500/10 rounded-lg`}>
                <Icon className={`w-3 h-3 sm:w-4 sm:h-4 text-${iconColor}-400`} />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
        {children}
    </div>
);

const TabButton = ({ id, label, icon: Icon, isActive, onClick, count, hasImg }: { 
    id: string; label: string; icon: any; isActive: boolean; onClick: () => void; count?: number; hasImg?: boolean
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all relative group flex-1 sm:flex-none justify-center ${
            isActive 
            ? "text-blue-400 border-b-2 border-blue-400 bg-gradient-to-t from-blue-500/5 to-transparent" 
            : "text-gray-500 hover:text-gray-300"
        }`}
    >
        <div className="relative flex items-center gap-1 sm:gap-2">
            <Icon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">{label}</span>
            
            {hasImg && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
        </div>

        {count !== undefined && count > 0 && (
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-blue-500/20 text-blue-300" : "bg-gray-800 text-gray-400"
            }`}>
                {count}
            </span>
        )}
    </button>
);

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
            <span className="text-xs text-gray-500">{formatDateTime(log.changed_at)}</span>
        </div>
        
        <div className="space-y-2">
            <div className="flex items-center">
                <div className="flex-1"><Badge variant={log.old_status}>{log.old_status.toUpperCase()}</Badge></div>
                <ChevronRight size={16} className="text-gray-600 mx-2" />
                <div className="flex-1 text-right"><Badge variant={log.new_status}>{log.new_status.toUpperCase()}</Badge></div>
            </div>
            {log.note && (
                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Note: </span>{log.note}
                </p>
            )}
        </div>
    </div>
);

const DetailModal = () => {
    const { ticket, isOpen, close } = useTicketDetailModal();
    const [currentTab, setCurrentTab] = useState<'details' | 'logs' | 'attachment'>('details');
    const [isDownloading, setIsDownloading] = useState(false);

    const logCount = ticket?.status_logs?.length || 0;
    const hasAttachment = ticket?.image;

    const downloadTicketDetailPDF = useCallback(async () => {
        if (!ticket?.id || !ticket?.ticket_number || isDownloading) return;
        
        setIsDownloading(true);
        try {
            const blob = await apiService.getBlob(`/api/tickets/${ticket.id}/export_detail_pdf/`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ticket_${ticket.ticket_number}_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export ticket PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    }, [ticket?.id, ticket?.ticket_number, isDownloading]);

    const tabs = useMemo(() => [
        { id: 'details' as const, label: 'Details', icon: Info },
        { id: 'attachment' as const, label: 'Attachments', icon: Paperclip, hasImg: !!hasAttachment },
        { id: 'logs' as const, label: 'Activity', icon: History, count: logCount },
    ], [logCount, hasAttachment]);

    const content = (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
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
                        onClick={downloadTicketDetailPDF}
                        disabled={isDownloading}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 bg-gray-800 font-semibold rounded-md shadow-sm transition-all hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ml-auto sm:ml-0"
                        title="Download Ticket Report"
                    >
                        <FileText size={14} className="sm:w-[18px] sm:h-[18px] text-slate-500 group-hover:text-blue-600 transition-colors" />
                        <span className="hidden xs:inline">{isDownloading ? 'Downloading...' : 'Export PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800/60 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-full sm:min-w-0">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            isActive={currentTab === tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            count={tab.count}
                            hasImg={tab.hasImg}
                        />
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {currentTab === 'details' && ticket && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Title Section */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-4 sm:p-5 rounded-xl border border-gray-700/50">
                        <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2 tracking-tight line-clamp-2">{ticket.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                            <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-gray-600" />
                            Created {formatDateTime(ticket.created_at)}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-gray-800/50 border-b border-gray-700/50">
                            <FileText size={14} className="sm:w-4 sm:h-4 text-blue-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Description</span>
                        </div>
                        <div className="p-4 sm:p-5">
                            <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                                {ticket.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <InfoCard icon={Building2} iconColor="blue" title="Assignment">
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                                <span className="text-gray-200 font-medium truncate max-w-[80px] sm:max-w-none">{ticket.department_name}</span> 
                                <MoveRight size={10} className="sm:w-[14px] sm:h-[14px] text-gray-600 flex-shrink-0" /> 
                                <span className="text-gray-200 font-medium truncate max-w-[80px] sm:max-w-none">{ticket.assigned_to_dept_name}</span>
                            </div>
                        </InfoCard>

                        <InfoCard icon={User} iconColor="purple" title="Raised By">
                            <p className="text-gray-200 text-xs sm:text-sm font-medium truncate">{ticket.created_by_name}</p>
                        </InfoCard>

                        <InfoCard icon={Clock} iconColor="emerald" title="Created">
                            <p className="text-gray-200 text-xs sm:text-sm font-medium line-clamp-1">{formatDateTime(ticket.created_at)}</p>
                        </InfoCard>

                        <InfoCard icon={AlertCircle} iconColor="gray" title="Ref ID">
                            <p className="text-xs font-mono text-gray-400 bg-gray-900/50 p-1.5 sm:p-2 rounded border border-gray-700/50 truncate">
                                {ticket.id}
                            </p>
                        </InfoCard>
                    </div>
                </div>
            )}

            {currentTab === 'attachment' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-white">
                    {hasAttachment ? (
                        <div className="relative group">
                            <Image
                                src={ticket.image!}
                                alt={ticket?.title || 'Attachment'}
                                width={600}
                                height={600}
                                className="w-full h-auto rounded-xl border border-gray-700/50"
                                unoptimized
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                                <a
                                    href={ticket.image}
                                    download
                                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                                >
                                    <Download className="w-5 h-5 text-white" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 sm:py-16 text-center bg-gray-800/20 rounded-xl border border-gray-700/50 border-dashed">
                            <File className="w-8 h-8 sm:w-12 sm:h-12 text-gray-700 mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base font-medium text-gray-400">No attachment found</p>
                        </div>
                    )}
                </div>
            )}

            {currentTab === 'logs' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-3 sm:mb-4 flex items-center justify-between px-1">
                        <p className="text-xs sm:text-sm text-gray-400">
                            <span className="text-white font-medium">{logCount}</span> activity {logCount === 1 ? 'log' : 'logs'}
                        </p>
                        {logCount > 0 && <span className="text-xs text-gray-500">Most recent</span>}
                    </div>

                    {logCount > 0 ? (
                        <>
                            <div className="sm:hidden">
                                {ticket?.status_logs?.map((log, index) => (
                                    <MobileActivityCard key={index} log={log} />
                                ))}
                            </div>

                            <div className="hidden sm:block bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800/50 border-b border-gray-700/50">
                                            <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Change</th>
                                            <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Changed By</th>
                                            <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</th>
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
                                                <td className="px-5 py-4 text-sm text-gray-400 font-mono whitespace-nowrap">
                                                    {formatDateTime(log.changed_at)}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-400">
                                                    {log.note ? (
                                                        <div className="space-y-1">
                                                            <ViewTicketNoteButton log={log} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">No notes</span>
                                                    )}
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