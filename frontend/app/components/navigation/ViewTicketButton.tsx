import useTicketDetailModal from "@/app/hooks/useTicketDetailModal";
import { TicketType } from "@/app/hooks/useTicketDetailModal";
import { EyeIcon } from "lucide-react";

interface ViewTicketButtonProps {
    ticket: TicketType;
}

const ViewTicketButton: React.FC<ViewTicketButtonProps> = ({ ticket }) => {
    const ticketModal = useTicketDetailModal();

    return (
        <button 
            onClick={() => ticketModal.open(ticket)}
            className="flex items-center justify-center gap-2 text-sm bg-blue-600/50 hover:bg-blue-500 text-white px-2 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-medium"
        >
          <EyeIcon className="w-5 h-5" />
          View Ticket
        </button>
    )
}

export default ViewTicketButton