'use client';

import useReportsModal from "@/app/hooks/useReportsModal";
import { UserType } from "@/app/hooks/useReportsModal";
import { Home, Download } from "lucide-react";


interface ReportsButtonProps {
  user: UserType,
}

const ReportsButton: React.FC<ReportsButtonProps> = ({ user }) => {
    const reportsModal = useReportsModal();

    return (
        <button 
            onClick={() => reportsModal.open(user)}
            className="flex items-center w-full px-4 py-3 gap-3 rounded-xl transition-all duration-300 group relative text-gray-400 hover:bg-gray-700/50 hover:text-white"
        >
          <div className={`p-2 rounded-lg bg-gray-700/30`}>
            <Download className="w-5 h-5" />
          </div>
          Reports
        </button>
    )
}

export default ReportsButton