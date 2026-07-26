'use client'

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, ArrowUpDown, Clock, AlertCircle, CheckCircle2, Tag, Layers, ChevronLeft,
  ChevronRight, X, User, Building2, Hash
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

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const TicketsPage = ({ user, departments }: { user: UserType; departments: any[] }) => {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(new Date().toLocaleTimeString())
  }, [])

  const resolutionModal = useResolutionModal();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // 500ms delay
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    ordering: "-created_at",
    department: "",
    assigned_to: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const queryParams: Record<string, string> = {
        search: debouncedSearch,
        status: filters.status,
        priority: filters.priority,
        ordering: filters.ordering,
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      };

      if (user?.is_admin && filters.department === "all") {
        delete queryParams.department;
        delete queryParams.assigned_to;
      }

      else if (filters.department === "my_department" || (filters.department && filters.department !== "all")) {
        const deptId = filters.department === "my_department" 
          ? user?.department_id.toString() 
          : filters.department;
        
        queryParams.department = deptId || "";
        delete queryParams.assigned_to;
      } 
      else {
        queryParams.assigned_to = user?.department_id.toString() || "";
        delete queryParams.department;
      }

      // Only admins can filter by specific assigned_to user/dept if provided
      if (user?.is_admin && filters.assigned_to) {
        queryParams.assigned_to = filters.assigned_to;
      }

      const response = await apiService.get(`/api/tickets/?${new URLSearchParams(queryParams).toString()}`);

      if (response.success) {
        setTickets(response.results);
        setTotalCount(response.count);
      } else {
        setErrorMessage(response.error);
      }
    } catch (error) {
      if (DEBUG) console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, currentPage, user]);

  const totalPages = Math.ceil(totalCount / pageSize);

  useTicketSocket(fetchTickets, user);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
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
        alert(error.response?.data?.detail || "Update failed");
        fetchTickets();
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
  };

  // Calculate stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length;

  // Mobile card view for tickets
  const MobileTicketCard = ({ ticket, onStatusChange }: { ticket: TicketType; onStatusChange: (ticketId: string, newStatus: string) => void }) => (
    <div className="sm:hidden bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-3 hover:bg-gray-700/20 transition-all">
      {/* Header with ticket number and actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-mono text-gray-400">#{ticket.ticket_number}</span>
        </div>
        <ViewTicketButton ticket={ticket} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-white mb-3 line-clamp-2">{ticket.title}</h3>

      {/* Status and Priority Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} ticketId={ticket.id} onStatusChange={onStatusChange} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Department Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{ticket.created_by_name}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Building2 className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{ticket.department_name}</span>
        </div>
      </div>

      {/* Status selector for mobile (hidden on desktop) */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 sm:hidden">
        <select
          value={ticket.status}
          disabled={['closed'].includes(ticket.status)}
          onChange={(e) => onStatusChange(ticket.id, e.target.value)}
          className={`w-full px-3 py-2 rounded-lg text-xs font-medium border bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${
            ticket.status === 'open' ? 'border-emerald-500/30 text-emerald-300' :
            ticket.status === 'in_progress' ? 'border-blue-500/30 text-blue-300' :
            ticket.status === 'resolved' ? 'border-purple-500/30 text-purple-300' :
            'border-gray-500/30 text-gray-300'
          }`}
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
      {/* Header with gradient */}
      <div className="border-b border-gray-800/60 bg-gray-900/50 backdrop-blur-sm">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">Ticket Management</h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 ml-14 hidden sm:block">Track, manage, and resolve departmental service requests</p>
            </div>
            <div className="flex items-center gap-3">
              <AddTicketButton />
              <ReportsButton user={user} />
            </div>
          </div>

          {/* Stats Cards - Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <StatCard icon={Layers} label="Total" value={totalCount.toString()} color="blue" />
            <StatCard icon={AlertCircle} label="Open" value={openTickets.toString()} color="emerald" />
            <StatCard icon={Clock} label="In Progress" value={inProgressTickets.toString()} color="purple" />
            <StatCard icon={CheckCircle2} label="High Priority" value={highPriorityTickets.toString()} color="rose" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filters Bar */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, ticket number, or requester..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 sm:py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Chips Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Filters:</span>
            
            {/* Status Filter Chip */}
            <div className="relative group">
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({...filters, status: e.target.value});
                  setCurrentPage(1);
                }}
                className="appearance-none bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-full px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={12} className="text-gray-500 rotate-90" />
              </div>
            </div>

            {/* Priority Filter Chip */}
            <div className="relative group">
              <select
                value={filters.priority}
                onChange={(e) => {
                  setFilters({...filters, priority: e.target.value});
                  setCurrentPage(1);
                }}
                className="appearance-none bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-full px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={12} className="text-gray-500 rotate-90" />
              </div>
            </div>

            {/* Department Filter Chip */}
            <div className="relative group">
              <select
                value={filters.department}
                onChange={(e) => {
                  setFilters({ ...filters, department: e.target.value });
                  setCurrentPage(1);
                }}
                className="appearance-none bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-full px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-[140px]"
              >
                <option value="">My Dept</option>
                {user?.is_admin && <option value="all">All Depts</option>}
                <option value="my_department">My Created</option>
                {departments.slice(0, 5).map((department: any) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
                {departments.length > 5 && (
                  <option disabled>─── more ───</option>
                )}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={12} className="text-gray-500 rotate-90" />
              </div>
            </div>

            {/* Admin: Assigned To Filter Chip */}
            {user?.is_admin && (
              <div className="relative group">
                <select
                  value={filters.assigned_to}
                  onChange={(e) => {
                    setFilters({ ...filters, assigned_to: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-full px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-[140px]"
                >
                  <option value="">Assigned To</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight size={12} className="text-gray-500 rotate-90" />
                </div>
              </div>
            )}

            {/* Ordering Toggle */}
            <button
              onClick={() => {
                const newOrdering = filters.ordering === "-created_at" ? "created_at" : "-created_at";
                setFilters({...filters, ordering: newOrdering});
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filters.ordering === "-created_at"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : "bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700/80"
              }`}
            >
              <ArrowUpDown size={12} />
              {filters.ordering === "-created_at" ? "Newest First" : "Oldest First"}
            </button>

            {/* Active Filters Count & Clear Button */}
            {(() => {
              const activeFilters = [
                filters.status,
                filters.priority,
                filters.department && filters.department !== "",
                filters.assigned_to && filters.assigned_to !== "",
                search
              ].filter(Boolean).length;
              
              return activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all ml-auto"
                >
                  <X size={12} />
                  Clear All ({activeFilters})
                </button>
              );
            })()}
          </div>

          {/* Active Filters Display - Shows selected values */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-700/30">
            {filters.status && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-md text-xs text-blue-400">
                Status: {filters.status.replace('_', ' ')}
                <button onClick={() => setFilters({...filters, status: ""})}>
                  <X size={10} className="hover:text-blue-300" />
                </button>
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded-md text-xs text-purple-400">
                Priority: {filters.priority}
                <button onClick={() => setFilters({...filters, priority: ""})}>
                  <X size={10} className="hover:text-purple-300" />
                </button>
              </span>
            )}
            {filters.department === "my_department" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md text-xs text-emerald-400">
                My Created Tickets
                <button onClick={() => setFilters({...filters, department: ""})}>
                  <X size={10} className="hover:text-emerald-300" />
                </button>
              </span>
            )}
            {filters.department && filters.department !== "my_department" && filters.department !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-md text-xs text-orange-400">
                Dept: {departments.find(d => d.id.toString() === filters.department)?.name || filters.department}
                <button onClick={() => setFilters({...filters, department: ""})}>
                  <X size={10} className="hover:text-orange-300" />
                </button>
              </span>
            )}
            {filters.assigned_to && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 rounded-md text-xs text-teal-400">
                Assigned To: {departments.find(d => d.id.toString() === filters.assigned_to)?.name}
                <button onClick={() => setFilters({...filters, assigned_to: ""})}>
                  <X size={10} className="hover:text-teal-300" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/50 rounded-lg sm:rounded-xl text-red-400 text-xs sm:text-sm flex justify-between items-center">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="hover:text-red-300">
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <p className="text-xs sm:text-sm text-gray-400">
              <span className="text-white font-medium">{tickets.length}</span> of{" "}
              <span className="text-white font-medium">{totalCount}</span> tickets
            </p>
          </div>
          <div className="text-xs text-gray-600">
            Last Updated: {time}
          </div>
        </div>

        {/* Mobile Card View (hidden on sm and above) */}
        <div className="sm:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-3 animate-pulse">
                <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-2/3"></div>
              </div>
            ))
          ) : tickets.length > 0 ? (
            tickets.map((ticket) => (
              <MobileTicketCard key={ticket.id} ticket={ticket} onStatusChange={handleStatusChange} />
            ))
          ) : (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 text-center">
              <div className="p-3 bg-gray-800/50 rounded-full inline-block mb-3">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-white mb-1">No tickets found</p>
              <p className="text-xs text-gray-500 mb-3">Try adjusting your filters</p>
              {(search || filters.status || filters.priority) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden sm:block bg-gray-800/20 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
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
                          <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {ticket.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={ticket.status} ticketId={ticket.id} onStatusChange={handleStatusChange} />
                      </td>
                      <td className="px-6 py-5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300">{ticket.department_name}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
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

            {/* Pagination - Responsive */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-700/50 bg-gray-800/20">
                <p className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
                  Showing <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="text-white font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="text-white font-medium">{totalCount}</span>
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg sm:rounded-xl text-sm font-medium text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-600 hover:text-white transition-all"
                  >
                    <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                          className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
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
                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg sm:rounded-xl text-sm font-medium text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-600 hover:text-white transition-all"
                  >
                    <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Pagination (simplified) */}
        {totalPages > 0 && (
          <div className="sm:hidden flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-400 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-400 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ResolutionModal onRefresh={fetchTickets} />
    </div>
  );
};

export default TicketsPage;