import { create } from "zustand";
import { TicketType } from "./useTicketDetailModal";
import { TicketLogType } from "../components/navigation/ViewTicketNoteButton";

interface TicketNoteModalStore {
    isOpen: boolean;
    log: TicketLogType | undefined;
    open: (log: TicketLogType) => void;
    close: () => void;
}

const useTicketNoteModal = create<TicketNoteModalStore>((set) => ({
    isOpen: false,
    log: undefined,
    open: (log) => set({ isOpen: true, log }),
    close: () => set({ isOpen: false }),
}));

export default useTicketNoteModal;