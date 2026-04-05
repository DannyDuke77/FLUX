'use client';

import useReportsModal from "@/app/hooks/useReportsModal";
import { UserType } from "@/app/hooks/useReportsModal";
import { Download } from "lucide-react";


interface ReportsButtonProps {
  user: UserType,
  className?: string
}

const ReportsButton: React.FC<ReportsButtonProps> = ({ user, className }) => {
    const reportsModal = useReportsModal();

    return (
        <button 
            onClick={() => reportsModal.open(user)}
            className="flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium"
        >
          <Download className="w-5 h-5" />
          Reports
        </button>
    )
}

export default ReportsButton;