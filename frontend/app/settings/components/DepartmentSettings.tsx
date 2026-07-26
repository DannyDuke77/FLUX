"use client";

import { useEffect, useState } from "react";
import apiService from "@/app/services/apiService";
import { 
    Plus, 
    Building2, 
    Loader2, 
    ListTree, 
    ChevronLeft, 
    ChevronRight, 
    Hash,
    Trash2,
    Edit2,
    Check,
    X
} from "lucide-react";

type DepartmentType = {
  id: string;
  name: string;
  company?: string;
  is_active?: boolean;
};

type DepartmentsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DepartmentType[];
};

const DepartmentSettings = ({ departments }: { departments: DepartmentsResponse }) => {
    const [deptList, setDeptList] = useState<DepartmentType[]>(departments.results);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departmentName, setDepartmentName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    let totalCount = deptList.length;
    let hasNext = !!departments.next;
    let hasPrev = !!departments.previous;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const handleAddDepartment = async () => {
        if (!departmentName.trim()) return;
        setIsSubmitting(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append("name", departmentName);
        formData.append("is_active", "true");

        try {
            const createdDepartment = await apiService.post("/api/departments/", formData);
            setDeptList(prev => [...prev, createdDepartment]);
            setDepartmentName("");
        } catch (error: any) {
            console.error("Error adding department:", error);
            setErrorMessage(error.response?.data?.message || "Failed to add department");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDepartment = async (id: string) => {
        if (!editingName.trim()) return;
        
        const formData = new FormData();
        formData.append("name", editingName);

        try {
            const updatedDepartment = await apiService.patch(`/api/departments/${id}/`, formData);
            setDeptList(prev =>
                prev.map(d => (d.id === id ? updatedDepartment : d))
            );

            setEditingId(null);
            setEditingName("");
        } catch (error: any) {
            console.error("Error editing department:", error);
            setErrorMessage(error.response?.data?.message || "Failed to update department");
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this department? ")) return;
        
        try {
            await apiService.patch(`/api/departments/${id}/`, { is_active: false });
            setDeptList(prev => prev.filter(d => d.id !== id));
        } catch (error: any) {
            console.error("Error deleting department:", error);
            setErrorMessage(error.response?.data?.message || "Failed to delete department");
        }
    };

    const startEdit = (dept: DepartmentType) => {
        setEditingId(dept.id);
        setEditingName(dept.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    return (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="border-b border-gray-700/50 bg-gray-800/40 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Departments</h3>
                            <p className="text-xs text-gray-400">Manage company structure and teams</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/30 rounded-full border border-gray-600/50">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">{totalCount} Total</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex justify-between items-center">
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input Section */}
            <div className="p-6 border-b border-gray-700/50">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="New department name..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                    />
                    <button
                        disabled={isSubmitting || !departmentName.trim()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-500/25 disabled:shadow-none disabled:cursor-not-allowed"
                        onClick={handleAddDepartment}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Department
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="p-6">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-700/50">
                    <ListTree className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department List</span>
                </div>

                <div className="min-h-[400px]">
                    {deptList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-4 bg-gray-700/30 rounded-full mb-4">
                                <Building2 className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 font-medium mb-1">No departments found</p>
                            <p className="text-sm text-gray-500">Create your first department using the form above</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {deptList.map((dept : any) => (
                                <div 
                                    key={dept.id} 
                                    className="group flex items-center justify-between p-3 rounded-xl bg-gray-800/20 border border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-800/40 transition-all"
                                >
                                    {editingId === dept.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditDepartment(dept.id)}
                                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleEditDepartment(dept.id)}
                                                className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-gray-200">{dept.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(dept)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                    title="Edit department"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Delete department"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalCount > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Page <span className="font-semibold text-gray-300">{currentPage}</span> •{" "}
                            <span className="text-gray-400">{totalCount} total departments</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPrev || loading}
                                className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNext || loading}
                                className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentSettings;