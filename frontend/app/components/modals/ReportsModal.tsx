'use client';

import { useState, useEffect } from 'react';
import useReportsModal from "@/app/hooks/useReportsModal";
import Modal from "./Modal";
import apiService from "@/app/services/apiService";
import { ChevronDown, Calendar, FileText } from "lucide-react";

const DEBUG = process.env.NODE_ENV !== 'production';

const ReportsModal = () => {
  const { isOpen, close, user } = useReportsModal();
  const [rangeType, setRangeType] = useState<'all' | 'custom'>('all');
  const [selectedDept, setSelectedDept] = useState('all');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiService.get('/api/departments/');
        setDepartments(Array.isArray(response) ? response : response.results || []);
      } catch (error) {
        if (DEBUG) console.error("Error fetching departments:", error);
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const buildParams = (type: "csv" | "pdf") => {
    const params = new URLSearchParams();

    params.append("range", rangeType);

    if (rangeType === "custom") {
      params.append("start", startDate);
      params.append("end", endDate);
    }

    if (user?.is_admin) {
      params.append("department", selectedDept);
    } else {
      params.append("department", user?.department_id || "");

    }

    params.append("type", type);

    return params.toString();
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleExportCsv = async () => {
    try {
      setLoading(true);

      const query = buildParams("csv");
      const blob = await apiService.getBlob(`/api/tickets/export_csv/?${query}`);

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setLoading(true);

      const query = buildParams("csv");
      const blob = await apiService.getBlob(`/api/tickets/export_pdf/?${query}`);

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <form className="space-y-6 text-left">
      {/* Range Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400">Report Range</label>
        <div className="grid grid-cols-2 gap-3">
          {(['all', 'custom'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRangeType(type)}
              className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                rangeType === type
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              }`}
            >
              {type === 'all' ? 'All Time' : 'Custom Range'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Inputs - Custom Range */}
      {rangeType === 'custom' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      )}

      {/* Admin Department Selector */}
      {user?.is_admin && ( //
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400">Filter by Department</label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments</option>
                {departments.map((department: any) => (
                    <option key={department.id} value={department.id}>
                        {department.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      <button 
        onClick={handleExportCsv}
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Download CSV Report'}
      </button>

      <button 
        onClick={handleExportPdf}
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Download PDF Report'}
      </button>
    </form>
  );

  return (
    <Modal
      label="Report Center"
      isOpen={isOpen}
      close={close}
      content={content}
    />
  );
};

export default ReportsModal;