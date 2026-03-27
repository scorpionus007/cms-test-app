import { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    Download,
    User,
    Shield,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Activity,
    Info
} from 'lucide-react';
import { auditApi } from '../api/auditApi';
import toast from 'react-hot-toast';

interface AuditLog {
    id: string;
    action: string;
    actor_client_id: string;
    resource_type: string;
    resource_id: string;
    ip_address: string;
    created_at: string;
    metadata: any;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response: any = await auditApi.getAuditLogs({
                page,
                limit: 10,
                action: actionFilter || undefined
            });
            
            console.log("Audit Logs API Response:", response);
            
            // The exact response structure depends on the API implementation
            // Based on backend audit.controller.js, it returns { logs, pagination }
            setLogs(response.logs || []);
            setPagination(response.pagination || null);
        } catch (error) {
            toast.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };


    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('WITHDRAWN')) return 'text-red-600 bg-red-50 border-red-100';
        if (action.includes('CREATE') || action.includes('GRANT') || action.includes('INVITE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (action.includes('UPDATE')) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
                    <p className="text-slate-500 font-medium text-sm">Comprehensive trail of all administrative and system actions.</p>
                </div>
                <button className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-all active:scale-95 space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by action (e.g., PURPOSE_CREATE)..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4 mr-2" />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-16">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">Fetching activity logs...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No activity logs found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 font-mono">
                                                    {new Date(log.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {new Date(log.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 mr-2">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">
                                                    {log.actor_client_id ? log.actor_client_id.substring(0, 13) + '...' : 'System'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs font-bold text-slate-500">
                                                <Shield className="w-3.5 h-3.5 mr-1.5 opacity-40" />
                                                <span className="capitalize">{log.resource_type || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Showing <span className="text-slate-900">{logs.length}</span> of <span className="text-slate-900">{pagination.total}</span> events
                        </p>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </button>
                            <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-600">
                                {page} / {pagination.total_pages}
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page === pagination.total_pages}
                                className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
