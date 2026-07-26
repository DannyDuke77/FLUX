'use client'

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, Filter, ArrowUpDown, Clock, AlertCircle, CheckCircle2, Layers, 
  ChevronLeft, ChevronRight, X, User, Building2, Hash, RefreshCw, ClockAlert,
  Hourglass
} from "lucide-react";
import apiService from "../services/apiService";
import AddTicketButton from "../components/navigation/AddTicketButton";
import ViewTicketButton from "../components/navigation/ViewTicketButton";
import { TicketType } from "../hooks/useTicketDetailModal";
import { useTicketSocket } from "../hooks/useTicketSocket";
import { UserType } from "../hooks/useReportsModal";
import useResolutionModal from "../hooks/useResolutionModal";
import ResolutionModal from "../components/modals/ResolutionModal";
import ReportsButton from "../components/navigation/ReportsButton";
import StatCard from "../components/tickets/StatCard";
import StatusBadge from "../components/tickets/StatusBadge";
import PriorityBadge from "../components/tickets/PriorityBadge";

const DEBUG = process.env.NODE_ENV !== 'production';

// Hook for debouncing input values
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

interface TicketsPageProps {
  user: UserType;
  departments: Array<{ id: number | string; name: string }>;
}

const TicketsPage: React.FC<TicketsPageProps> = ({ user, departments }) => {
  const resolutionModal = useResolutionModal();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    ordering: "-created_at",
    department: "",
    assigned_to: ""
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const queryParams: Record<string, string> = {
        search: debouncedSearch,
        status: filters.status,
        priority: filters.priority,
        ordering: filters.ordering,
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      };

      if (user.is_admin && filters.department === "all") {
        // Do nothing
      } else if (filters.department === "my_department" || (filters.department && filters.department !== "all")) {
        queryParams.department = filters.department === "my_department" 
          ? user.department_id.toString() 
          : filters.department;
      } else {
        queryParams.assigned_to = user.department_id?.toString() || "";
      }

      if (user.is_admin && filters.assigned_to) {
        queryParams.assigned_to = filters.assigned_to;
      }

      const response = await apiService.get(`/api/tickets/?${new URLSearchParams(queryParams).toString()}`);

      if (response.success) {
        setTickets(response.results);
        setTotalCount(response.count);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.error || "An API error occurred.");
      }
    } catch (error) {
      if (DEBUG) console.error("CRITICAL: Ticket sync failure:", error);
      setErrorMessage("Network synchronization failed. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, currentPage, user]);

  // WebSocket
  const wsStatus = useTicketSocket(fetchTickets, user);

  // Initial data fetch and debounced search
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (['open', 'resolved', 'closed'].includes(newStatus)) {
      resolutionModal.open(ticketId, newStatus);
      return;
    }

    try {
      await apiService.patch(`/api/tickets/${ticketId}/`, { status: newStatus });
      fetchTickets();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Status modification rejected.");
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      ordering: "-created_at",
      department: "",
      assigned_to: "",
    });
    setSearch("");
    setCurrentPage(1);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      highPriority: tickets.filter(t => ['high', 'critical'].includes(t.priority)).length,
    };
  }, [tickets]);

  const activeFiltersCount = useMemo(() => {
    return [
      filters.status,
      filters.priority,
      filters.department,
      filters.assigned_to,
      debouncedSearch
    ].filter(Boolean).length;
  }, [filters, debouncedSearch]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
              <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Tickets Queue</h1>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Track, manage, and resolve departmental service requests</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <ReportsButton user={user} />
            <AddTicketButton />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Layers} label="Total" value={totalCount.toString()} color="blue" />
          <StatCard icon={AlertCircle} label="Open" value={stats.open.toString()} color="emerald" />
          <StatCard icon={Hourglass} label="In Progress" value={stats.inProgress.toString()} color="purple" />
          <StatCard icon={ClockAlert} label="High Priority" value={stats.highPriority.toString()} color="rose" />
        </section>

        {/* Search */}
        <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl shadow-black/20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search sequence keys, titles, or authors..."
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-11 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-sm placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters(p => ({...p, status: e.target.value}))}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer appearance-none outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-2 h-2 border-r border-b border-slate-500 rotate-45" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={filters.priority}
                onChange={(e) => setFilters(p => ({...p, priority: e.target.value}))}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer appearance-none outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-2 h-2 border-r border-b border-slate-500 rotate-45" />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={filters.department}
                onChange={(e) => setFilters(p => ({...p, department: e.target.value}))}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer appearance-none outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px]"
              >
                <option value="">Assigned To Me</option>
                {user?.is_admin && <option value="all">All Tickets</option>}
                <option value="my_department">My Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-2 h-2 border-r border-b border-slate-500 rotate-45" />
            </div>

            <button
              onClick={() => setFilters(p => ({...p, ordering: p.ordering === "-created_at" ? "created_at" : "-created_at"}))}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                filters.ordering === "-created_at"
                  ? "bg-blue-950/40 border-blue-800/60 text-blue-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpDown size={12} />
              {filters.ordering === "-created_at" ? "Oldest to Newest" : "Newest to Oldest"}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
              >
                <X size={12} />
                Reset Parameters ({activeFiltersCount})
              </button>
            )}
          </div>
        </section>

        {/* Runtime API/WS Exception Handling Banners */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400/60 hover:text-rose-300">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tickets Table */}
        <div className="space-y-3">
          
          {/* Table Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span>Displaying {tickets.length} of {totalCount} Records indexed</span>
            </div>
            <div 
              className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider 
              ${wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-rose-400'}`
            }>
              <span 
                className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-rose-400'}`}
              />
              {wsStatus === 'connected' ? 'Live Sync' :wsStatus === 'connecting' ? 'Syncing...' :'Sync Paused'}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 font-medium text-xs tracking-wider uppercase">
                  <th className="px-6 py-4 font-semibold">Ticket Details</th>
                  <th className="px-6 py-4 font-semibold">Current Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Assignment</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {loading && tickets.length === 0 ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse bg-slate-900/10">
                      <td colSpan={6} className="px-6 py-7"><div className="h-5 bg-slate-800/50 rounded-lg w-2/3" /></td>
                    </tr>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                            <span>#{ticket.ticket_number}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{ticket.created_by_name}</span>
                          </div>
                          <span className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {ticket.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <StatusBadge status={ticket.status} ticketId={ticket.id} onStatusChange={handleStatusChange} />
                      </td>
                      <td className="px-6 py-4.5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4.5 text-slate-400">
                        <div className="font-medium text-xs text-slate-300">{ticket.department_name}</div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>To: {ticket.assigned_to_dept_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        <div className="text-slate-300">
                          {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">
                          {new Date(ticket.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <ViewTicketButton ticket={ticket} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center max-w-sm mx-auto">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-600 mb-3 shadow-inner">
                          <AlertCircle size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200">No tickets found</h3>
                        <p className="text-xs text-slate-500 mt-1">Refine your search criteria or reset parameters to reveal more results.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <footer className="flex items-center justify-between px-6 py-4 border-t border-slate-800/60 bg-slate-900/20 text-xs text-slate-400">
                <div>
                  Showing page <span className="text-slate-200 font-medium">{currentPage}</span> of <span className="text-slate-200 font-medium">{totalPages}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 text-slate-300 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 text-slate-300 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </footer>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {loading && tickets.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 animate-pulse h-32" />
              ))
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                      <Hash size={12} />
                      <span>{ticket.ticket_number}</span>
                    </div>
                    <ViewTicketButton ticket={ticket} />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 line-clamp-2 leading-tight">{ticket.title}</h4>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={ticket.status} ticketId={ticket.id} onStatusChange={handleStatusChange} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
                    <div className="flex items-center gap-1 min-w-0">
                      <User size={12} className="text-slate-600 shrink-0" />
                      <span className="truncate">{ticket.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0 justify-end">
                      <Building2 size={12} className="text-slate-600 shrink-0" />
                      <span className="truncate">{ticket.department_name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl py-12 text-center text-xs text-slate-500">
                No active events captured inside the system footprint.
              </div>
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-1 pt-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-medium rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 font-mono">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-medium rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      <ResolutionModal onRefresh={fetchTickets} />
    </div>
  );
};

export default TicketsPage;