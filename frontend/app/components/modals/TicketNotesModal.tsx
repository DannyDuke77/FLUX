'use client';

import useTicketNoteModal from "@/app/hooks/useTicketNoteModal";
import Modal from "./Modal";

const NotesModal = () => {
    const modal = useTicketNoteModal();
    
    const content = (
        <div className="space-y-5">
            <div className="space-y-3">
                <p className="text-sm text-gray-500">
                    {modal.log?.note }
                </p>
            </div>
        </div>
    );

    return (
        <Modal 
            isOpen={modal.isOpen} 
            label="Notes" 
            close={modal.close} 
            content={content} 
        />
    );
};

export default NotesModal;