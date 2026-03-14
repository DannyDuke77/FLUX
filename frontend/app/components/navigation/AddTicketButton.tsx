'use client';

import useAddTicketModal from "@/app/hooks/useAddTicketModal";
import { Home, Plus } from "lucide-react";

const AddTicketButton = () => {
    const ticketModal = useAddTicketModal();

    return (
        <button 
            onClick={() => ticketModal.open()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </button>
    )
}

export default AddTicketButton;