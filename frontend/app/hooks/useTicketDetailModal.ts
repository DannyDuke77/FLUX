import { create } from "zustand";

export type TicketType = {
    id: string;
    ticket_number: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    department_name: string;
    assigned_to_dept_name: string;
    assigned_to: string;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    status_logs: {
        old_status: string;
        new_status: string;
        changed_by_name: string;
        changed_at: string;
    }[];
};

interface TicketDetailModalState {
    isOpen: boolean;
    ticket: TicketType | null;
    open: (ticket: TicketType) => void;
    close: () => void;
}

const useTicketDetailModal = create<TicketDetailModalState>((set) => ({
    isOpen: false,
    ticket: null,
    open: (ticket) => set({ isOpen: true, ticket }),
    close: () => set({ isOpen: false, ticket: null }),
}));

export default useTicketDetailModal;