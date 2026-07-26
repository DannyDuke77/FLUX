import useTicketDetailModal from "@/app/hooks/useTicketDetailModal";
import { TicketType } from "@/app/hooks/useTicketDetailModal";
import { EyeIcon, ChevronRight } from "lucide-react";

interface ViewTicketButtonProps {
    ticket: TicketType;
}

const ViewTicketButton: React.FC<ViewTicketButtonProps> = ({ ticket }) => {
    const ticketModal = useTicketDetailModal();

    return (
        <button 
            onClick={() => ticketModal.open(ticket)}
            className="text-sm flex items-center gap-1 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-700/10 transition-all rounded-full cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
    )
}

export default ViewTicketButton