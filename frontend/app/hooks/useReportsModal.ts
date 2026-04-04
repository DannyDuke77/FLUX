import { create } from "zustand";

export type UserType = {
    id: string;
    name: string;
    department_id: string;
    is_admin: boolean;
    company: string;
}

interface ReportsModalStore {
    isOpen: boolean;
    user: UserType | null;
    open: (user: UserType) => void;
    close: () => void;
}

const useReportsModal = create<ReportsModalStore>((set) => ({
    isOpen: false,
    user: null,
    open: (user) => set({ isOpen: true, user }),
    close: () => set({ isOpen: false, user: null }),
}));

export default useReportsModal;