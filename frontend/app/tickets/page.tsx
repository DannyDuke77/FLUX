'use client'

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ArrowUpDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Download
} from "lucide-react";
import Link from "next/link";
import apiService from "../services/apiService";
import AddTicketButton from "../components/navigation/AddTicketButton";
import ViewTicketButton from "../components/navigation/ViewTicketButton";
import { TicketType } from "../hooks/useTicketDetailModal";

// Enhanced Badge Component
const Badge = ({ children, variant, className = "" }: { children: React.ReactNode; variant: string; className?: string }) => {
    const variants: Record<string, string> = {
        // Status variants
        open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        closed: "bg-gray-500/15 text-gray-300 border-gray-500/30",
        resolved: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        
        // Priority variants
        high: "bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        critical: "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
    };
    
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant.toLowerCase()] || variants.closed} ${className}`}>
            {children}
        </span>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend?: string; color: string }) => (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600/50 transition-all group">
        <div className="flex items-center justify-between mb-3">
            <div className={`p-2 ${color}/10 rounded-xl border border-${color}/20`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            {trend && <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const TicketsPage = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    ordering: "-created_at"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch tickets based on search and filters defined in api.py
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: search,
        status: filters.status,
        priority: filters.priority,
        ordering: filters.ordering,
        page: currentPage.toString(),
        page_size: pageSize.toString()
      });

      const response = await apiService.get(`/api/tickets/?${queryParams.toString()}`);
      
      if (response.success) {
        setTickets(response.results);
        setTotalCount(response.count);
      } else {
        console.error("Failed to fetch tickets:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await apiService.patch(`/api/tickets/${ticketId}/`, {
        status: newStatus
      });
      
      if (response.id) {
        fetchTickets();
      } else {
        setErrorMessage(response);
        fetchTickets();
      }
    } catch (error: any) {
        const message = error.response?.data?.[0] || "Update failed";
        setErrorMessage(error.response?.data?.detail || "Status cannot be moved backwards");
        alert(`Action Denied: ${message}`);
        fetchTickets();
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      ordering: "-created_at"
    });
    setSearch("");
  };

  // Calculate stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'high').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
      {/* Header with gradient */}
      <div className="border-b border-gray-800/60 bg-gray-900/50 backdrop-blur-sm">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Ticket Management</h1>
              </div>
              <p className="text-gray-400 ml-14">Track, manage, and resolve departmental service requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:border-gray-600 transition-all flex items-center gap-2">
                <Download size={16} />
                Export
              </button>
              <AddTicketButton />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard icon={Layers} label="Total Tickets" value={totalCount.toString()} color="blue" />
            <StatCard icon={AlertCircle} label="Open" value={openTickets.toString()} color="emerald" />
            <StatCard icon={Clock} label="In Progress" value={inProgressTickets.toString()} color="purple" />
            <StatCard icon={CheckCircle2} label="High Priority" value={highPriorityTickets.toString()} color="rose" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:p-8">
        {/* Filters Bar */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title, ticket number, or requester..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Filter Toggle Button (Mobile/Desktop) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 flex items-center justify-center gap-2"
            >
              <Filter size={16} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filter Controls - Responsive */}
            <div className={`flex flex-col sm:flex-row gap-3 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
              <select 
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm min-w-[140px]"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>

              <select 
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm min-w-[140px]"
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select 
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm min-w-[140px]"
                value={filters.ordering}
                onChange={(e) => setFilters({...filters, ordering: e.target.value})}
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="priority">Priority (Critical to Low)</option>
                <option value="-priority">Priority (Low to Critical)</option>
              </select>

              {(filters.status || filters.priority || search) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Results header */}
          <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{tickets.length}</span> of{" "}
                <span className="text-white font-medium">{totalCount}</span> tickets
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Last updated {new Date().toLocaleTimeString()}
            </div>
          </div>

          {errorMessage && (
              <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex justify-between">
                  <span>{errorMessage}</span>
                  <button onClick={() => setErrorMessage(null)}>Close</button>
              </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-800/30">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="h-16 bg-gray-800/20 rounded-xl"></div>
                      </td>
                    </tr>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-700/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">#{ticket.ticket_number}</span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{ticket.created_by_name}</span>
                          </div>
                          <span className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">
                            {ticket.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={ticket.status}
                          disabled={['resolved', 'closed'].includes(ticket.status)}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            ticket.status === 'open' ? 'border-emerald-500/30 text-emerald-300' :
                            ticket.status === 'in_progress' ? 'border-blue-500/30 text-blue-300' :
                            'border-gray-500/30 text-gray-300'
                          }`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            ticket.priority === 'high' ? 'bg-red-500 animate-pulse' : 
                            ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-sm text-gray-300 capitalize">{ticket.priority}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300">{ticket.department_name}</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <ArrowUpDown size={10} /> to {ticket.assigned_to_dept_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">
                            {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <ViewTicketButton ticket={ticket} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                          <AlertCircle className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-lg font-medium text-white mb-1">No tickets found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                        {(search || filters.status || filters.priority) && (
                          <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION CONTROLS - Enhanced */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-700/50 bg-gray-800/20">
                <p className="text-sm text-gray-400 order-2 sm:order-1">
                  Showing <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="text-white font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="text-white font-medium">{totalCount}</span> results
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-600 hover:text-white transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-medium transition-all ${
                            currentPage === pageNumber 
                            ? "bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/20" 
                            : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-600 hover:text-white transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;