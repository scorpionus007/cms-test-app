import React, { useEffect, useState } from 'react';
import { dsrApi, DSRRequest, DSRTimelineEntry } from '../api/dsrApi';
import {
    Plus,
    Loader2,
    Search,
    User,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    Filter,
    Calendar,
    Activity,
    Database,
    Shield,
    Edit3,
    History,
    Info,
    Download,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: 'Pending', color: 'blue', icon: Clock },
    processing: { label: 'Processing', color: 'amber', icon: Activity },
    created: { label: 'Created', color: 'blue', icon: Clock },
    identity_verified: { label: 'Verified', color: 'indigo', icon: Shield },
    approved: { label: 'Approved', color: 'emerald', icon: CheckCircle2 },
    executing: { label: 'Executing', color: 'amber', icon: Activity },
    completed: { label: 'Completed', color: 'emerald', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'red', icon: AlertCircle },
    escalated: { label: 'Escalated', color: 'purple', icon: AlertCircle },
};

const REQUEST_TYPES = [
    { id: 'access', label: 'Data Access' },
    { id: 'erasure', label: 'Data Erasure' },
    { id: 'rectification', label: 'Data Rectification' },
    { id: 'portability', label: 'Data Portability' },
];

import { useAppStore } from '../store/appStore';

export default function DSRRequests() {
    const { selectedAppId } = useAppStore();
    const [requests, setRequests] = useState<DSRRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<DSRRequest | null>(null);
    const [timeline, setTimeline] = useState<DSRTimelineEntry[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    // Form fields for Create
    const [userId, setUserId] = useState('');
    const [type, setType] = useState('access');
    const [isCreating, setIsCreating] = useState(false);

    // Form fields for Update
    const [newStatus, setNewStatus] = useState('');
    const [metadataJSON, setMetadataJSON] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (selectedAppId) {
            fetchRequests();
        }
    }, [selectedAppId]);

    const fetchRequests = async () => {
        if (!selectedAppId) return;
        try {
            setLoading(true);
            const data = await dsrApi.getDsrRequests(selectedAppId);
            setRequests(data);
        } catch (error) {
            toast.error('Failed to fetch DSR requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppId) {
            toast.error('Please select an app first');
            return;
        }
        if (!userId) {
            toast.error('User ID is required');
            return;
        }
        
        try {
            setIsCreating(true);
            const response = await dsrApi.createDsrRequest(selectedAppId, { user_id: userId, type });
            
            toast.success('DSR Request created successfully');
            setShowCreateModal(false);
            setUserId('');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create request');
        } finally {
            setIsCreating(false);
        }
    };

    const handleViewDetails = async (request: DSRRequest) => {
        if (!selectedAppId) return;
        setSelectedRequest(request);
        setTimeline([]);
        try {
            setLoadingTimeline(true);
            const data = await dsrApi.getDsrStatus(selectedAppId, request.id);
            setTimeline(data.timeline);
        } catch (error) {
            toast.error('Failed to fetch request timeline');
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleOpenUpdate = (request: DSRRequest) => {
        setSelectedRequest(request);
        setNewStatus(request.status);
        setMetadataJSON(request.metadata ? JSON.stringify(request.metadata, null, 2) : '');
        setShowUpdateModal(true);
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !selectedAppId) return;

        let meta = {};
        try {
            if (metadataJSON) meta = JSON.parse(metadataJSON);
        } catch (e) {
            toast.error('Invalid JSON in metadata');
            return;
        }

        try {
            setIsUpdating(true);
            await dsrApi.updateDsrStatus(selectedAppId, selectedRequest.id, { status: newStatus, metadata: meta });
            toast.success('Status updated successfully');
            setShowUpdateModal(false);
            fetchRequests();
            if (selectedRequest) {
                const updated = await dsrApi.getDsrStatus(selectedAppId, selectedRequest.id);
                setSelectedRequest(updated.dsr);
                setTimeline(updated.timeline);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        return STATUS_CONFIG[status] || { label: status, color: 'slate', icon: Info };
    };

    const getStats = () => {
        const safeRequests = Array.isArray(requests) ? requests : [];
        const stats = {
            open: safeRequests.filter(r => ['created', 'identity_verified', 'approved', 'pending'].includes(r.status)).length,
            executing: safeRequests.filter(r => ['executing', 'processing'].includes(r.status)).length,
            completed: safeRequests.filter(r => r.status === 'completed').length,
            escalated: safeRequests.filter(r => r.status === 'escalated').length,
        };
        return stats;
    };

    const handleExport = async (id: string) => {
        if (!selectedAppId) return;
        try {
            const data = await dsrApi.exportDsrData(selectedAppId, id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dsr-export-${id}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Data exported successfully');
        } catch (error) {
            toast.error('Failed to export data');
        }
    };

    const stats = getStats();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">DSR Requests</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage and track data subject privacy requests.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create DSR Request
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Open Requests', value: stats.open, color: 'blue', icon: Clock },
                    { label: 'Executing', value: stats.executing, color: 'amber', icon: Activity },
                    { label: 'Completed', value: stats.completed, color: 'emerald', icon: CheckCircle2 },
                    { label: 'Escalated', value: stats.escalated, color: 'purple', icon: AlertCircle },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`w-16 h-16 text-${stat.color}-600`} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 leading-none">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Request ID or User ID..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all inline-flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Status
                    </button>
                    <button className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all inline-flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Date Range
                    </button>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 font-sans">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DSR ID</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested On</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4 opacity-50" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing data...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 grayscale opacity-50">
                                            <Database className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-900">Queue is empty</p>
                                        <p className="text-sm text-slate-500 mt-2">No data subject requests have been submitted yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => {
                                    const statusInfo = getStatusInfo(request.status);
                                    const Icon = statusInfo.icon;
                                    return (
                                        <tr key={request.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono font-bold text-slate-400 opacity-60">#{request.id.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mr-3.5 group-hover:scale-110 transition-transform">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{request.user_id}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified User</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase border border-slate-200 tracking-wider">
                                                    {request.request_type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border bg-${statusInfo.color}-50 text-${statusInfo.color}-700 border-${statusInfo.color}-100 shadow-sm`}>
                                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {new Date(request.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end space-x-3">
                                                    {request.request_type === 'access' && request.status === 'completed' && (
                                                        <button
                                                            onClick={() => handleExport(request.id)}
                                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                                                            title="Export Data"
                                                        >
                                                            <Download className="w-4.5 h-4.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewDetails(request)}
                                                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100"
                                                        title="View Timeline"
                                                    >
                                                        <History className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenUpdate(request)}
                                                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                                                        title="Update Status"
                                                    >
                                                        <Edit3 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create DSR Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-10 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">New DSR Request</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center">
                                    <span className="w-6 h-[1.5px] bg-slate-200 mr-2 rounded-full"></span>
                                    Initiating data protection workflow
                                </p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-all border border-slate-100/50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Verification</label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-4 w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center group-focus-within:bg-indigo-50 transition-colors border border-slate-200 group-focus-within:border-indigo-100">
                                        <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter User ID or Pseudonymous ID..."
                                        className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Protocol Selection</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {REQUEST_TYPES.map(rt => (
                                        <button
                                            key={rt.id}
                                            type="button"
                                            onClick={() => setType(rt.id)}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group/card ${
                                                type === rt.id
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-100 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${type === rt.id ? 'text-indigo-200' : 'text-slate-400'}`}>Procedure</div>
                                            <p className="text-xs font-bold leading-tight uppercase tracking-tight">{rt.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-2xl transition-all active:scale-95 uppercase tracking-widest border border-slate-200"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-4 bg-slate-900 hover:bg-indigo-950 text-white text-[10px] font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center uppercase tracking-widest"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            Execute Request
                                            <ChevronRight className="w-3.5 h-3.5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {showUpdateModal && selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Status Modification</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Refining request state: #{selectedRequest.id.substring(0, 8)}</p>
                            </div>
                            <button onClick={() => setShowUpdateModal(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Lifecycle Status</label>
                                <select
                                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all appearance-none"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, info]) => (
                                        <option key={key} value={key}>{info.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata payload (JSON)</label>
                                    <span className="text-[10px] font-bold text-slate-300">Optional attribute block</span>
                                </div>
                                <textarea
                                    className="w-full h-32 px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-mono font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder='{"key": "value"}'
                                    value={metadataJSON}
                                    onChange={(e) => setMetadataJSON(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="flex-1 py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-3xl transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-3xl shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center uppercase tracking-widest"
                                >
                                    {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Commit Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Timeline Details Drawer */}
            {selectedRequest && !showUpdateModal && (
                <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="px-10 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 flex items-center justify-center text-white mr-5">
                                    <History className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Lifecycle</h3>
                                    <div className="flex items-center mt-1">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-100 px-2 py-0.5 rounded-lg bg-indigo-50">DSR-#{selectedRequest.id.substring(0, 12)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            {/* Static Info Block */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Subject</p>
                                    <p className="text-sm font-black text-slate-900 break-all">{selectedRequest.user_id}</p>
                                </div>
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Type</p>
                                    <p className="text-sm font-black text-slate-900 uppercase">{selectedRequest.request_type}</p>
                                </div>
                            </div>

                            {/* Timeline Proper */}
                            <div className="space-y-8 relative">
                                <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
                                
                                {loadingTimeline ? (
                                    <div className="text-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Retrieving history logs...</p>
                                    </div>
                                ) : timeline.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                                        <p className="text-xs font-bold text-slate-400 uppercase">No history segments recorded</p>
                                    </div>
                                ) : (
                                    timeline.map((entry, idx) => {
                                        const statusInfo = getStatusInfo(entry.status);
                                        const EntryIcon = statusInfo.icon;
                                        return (
                                            <div key={idx} className="relative pl-14 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className={`absolute left-0 top-0 w-11 h-11 rounded-2xl border-2 flex items-center justify-center z-10 shadow-sm transition-transform hover:scale-110 bg-white border-${statusInfo.color}-100 text-${statusInfo.color}-600`}>
                                                    <EntryIcon className="w-5 h-5" />
                                                </div>
                                                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className={`text-sm font-black text-${statusInfo.color}-700 uppercase tracking-widest`}>{statusInfo.label}</h4>
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    {entry.metadata && (
                                                        <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 overflow-hidden">
                                                            <pre className="text-[10px] font-mono font-black text-slate-500 overflow-x-auto">
                                                                {JSON.stringify(entry.metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Order Status</p>
                                        <div className={`flex items-center text-sm font-black text-${getStatusInfo(selectedRequest.status).color}-700`}>
                                            <Activity className="w-4 h-4 mr-2" />
                                            {getStatusInfo(selectedRequest.status).label.toUpperCase()}
                                        </div>
                                    </div>
                                    {selectedRequest.request_type === 'access' && selectedRequest.status === 'completed' && (
                                        <button
                                            onClick={() => handleExport(selectedRequest.id)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest flex items-center"
                                        >
                                            <Download className="w-3.5 h-3.5 mr-2" />
                                            Export Data
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleOpenUpdate(selectedRequest)}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Modify State
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
