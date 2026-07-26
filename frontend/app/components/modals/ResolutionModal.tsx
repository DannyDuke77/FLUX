'use client';

import useResolutionModal from "@/app/hooks/useResolutionModal";
import apiService from "@/app/services/apiService";
import { useState } from "react";
import Modal from "./Modal";
import { AlertCircle, ChevronRight } from "lucide-react";
import { TicketLogType } from "../navigation/ViewTicketNoteButton";


const ResolutionModal = ({ onRefresh }: { onRefresh: () => void }) => {
    const modal = useResolutionModal();
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Logic: Note is required ONLY if status is 'resolved'
    const isNoteRequired = modal.newStatus === 'resolved' || modal.newStatus === 'open';;
    const isButtonDisabled = isNoteRequired ? !note.trim() : false;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await apiService.patch(`/api/tickets/${modal.ticketId}/`, {
                status: modal.newStatus,
                resolution_note: note.trim()
            });
            onRefresh();
            modal.close();
            setNote("");
        } catch (error) {
            alert("Failed to save resolution note.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const actionText: Record<string, string> = {
        open: 'Re-Open',
        resolved: 'Resolution',
        closed: 'Closure',
    };

    const content = (
        <div className="space-y-5">
            {/* Header/Instruction Area */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className={`mt-0.5 p-1.5 rounded-lg ${isNoteRequired ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                    <AlertCircle className={`w-4 h-4 ${isNoteRequired ? 'text-amber-400' : 'text-blue-400'}`} />
                </div>
                <p className="text-sm py-1.5 leading-relaxed text-gray-300">
                    {modal.newStatus === 'open' 
                        ? "Please provide a reason for re-opening this ticket. Explain what remains unresolved." 
                        : isNoteRequired 
                            ? "This ticket requires a resolution note. Please document the steps taken to fix the issue." 
                            : "You are closing this ticket. You may optionally provide a note with technical details or leave it blank."}
                </p>
            </div>

            {/* Textarea Input */}
            <div className="relative group">
                <textarea
                    autoFocus
                    className="w-full min-h-[160px] bg-gray-950/50 border border-gray-700/50 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none custom-scrollbar"
                    placeholder={modal.newStatus === 'open' ? "Reason for re-opening (Required)..." : "Technical details..."}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                {isNoteRequired && !note.trim() && (
                    <span className="absolute bottom-3 right-4 text-[10px] font-medium uppercase tracking-wider text-amber-500/60">
                        Required
                    </span>
                )}
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={modal.close}
                    className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    disabled={isButtonDisabled || isSubmitting}
                    onClick={handleSubmit}
                    className={`relative group px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 overflow-hidden ${isButtonDisabled && 'cursor-not-allowed'}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>  
                            <span>Confirm {actionText[modal.newStatus]}</span>
                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <Modal 
            label="Resolution Note"
            isOpen={modal.isOpen}
            close={modal.close}
            content={content}
        />
    );
};

export default ResolutionModal;