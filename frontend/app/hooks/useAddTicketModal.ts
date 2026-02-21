import { create } from "zustand";

interface AddTicketModalStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const useAddTicketModal = create<AddTicketModalStore>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));

export default useAddTicketModal;