import { create } from "zustand";

interface ResolutionModalStore {
    isOpen: boolean;
    ticketId: string;
    newStatus: string;
    open: (ticketId: string, newStatus: string) => void;
    close: () => void;
}

const useResolutionModal = create<ResolutionModalStore>((set) => ({
    isOpen: false,
    ticketId: "",
    newStatus: "",
    open: (ticketId, newStatus) => set({ isOpen: true, ticketId, newStatus }),
    close: () => set({ isOpen: false, ticketId: "", newStatus: "" }),
}));

export default useResolutionModal;