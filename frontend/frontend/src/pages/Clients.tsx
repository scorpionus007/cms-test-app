import React, { useEffect, useState } from 'react';
import {
    UserPlus,
    MoreVertical,
    Search,
    Filter,
    Mail,
    Shield,
    CheckCircle2,
    Clock,
    X,
    Loader2
} from 'lucide-react';
import { clientApi, Client } from '../api/clientApi';
import toast from 'react-hot-toast';

const Clients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [isInviting, setIsInviting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await clientApi.getClients();
            setClients(data);
        } catch (error) {
            toast.error('Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsInviting(true);
            await clientApi.inviteClient({ email: inviteEmail, role: inviteRole });
            toast.success('Client invited successfully');
            setIsInviteModalOpen(false);
            setInviteEmail('');
            fetchClients();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to invite client');
        } finally {
            setIsInviting(false);
        }
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        if (email) return email.substring(0, 2).toUpperCase();
        return '??';
    };

    const filteredClients = clients.filter(c =>
        (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage your organization's clients and their access levels.</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95 space-x-2"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Client</span>
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Loading clients...</p>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <p className="text-sm text-slate-500 font-medium">No clients found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3 border-2 border-white shadow-sm">
                                                    {getInitials(client.name, client.email)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{client.name || 'Pending...'}</div>
                                                    <div className="text-xs text-slate-400 font-medium flex items-center mt-0.5">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {client.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm font-semibold text-slate-700">
                                                <Shield className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                <span className="capitalize">{client.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${client.role === 'owner'
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                {client.role === 'owner' ? 'System' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsInviteModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Invite New Client</h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@example.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="auditor">Auditor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center"
                                >
                                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
