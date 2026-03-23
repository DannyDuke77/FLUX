import useTicketNoteModal from "@/app/hooks/useTicketNoteModal";
import { TicketType } from "@/app/hooks/useTicketDetailModal";
import { EyeIcon } from "lucide-react";

export type TicketLogType = {
    old_status: string;
    new_status: string;
    changed_by_name: string;
    changed_at: string;
    note: string;
}

interface ViewTicketNoteButtonProps {
    log: TicketLogType;
}

const ViewTicketNoteButton: React.FC<ViewTicketNoteButtonProps> = ({ log }) => {
    const ticketNoteModal = useTicketNoteModal();

    return (
        <button 
            onClick={() => ticketNoteModal.open(log)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          View more
        </button>
    )
}

export default ViewTicketNoteButton;