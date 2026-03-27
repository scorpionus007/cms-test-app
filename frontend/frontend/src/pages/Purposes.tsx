import React, { useEffect, useState } from 'react';
import {
    Plus,
    Shield,
    Trash2,
    CheckCircle2,
    X,
    Loader2
} from 'lucide-react';
import { purposeApi, Purpose } from '../api/purposeApi';
import { dataCatalogApi, DataCatalogEntry } from '../api/dataCatalogApi';
import toast from 'react-hot-toast';

const Purposes = () => {
    const [purposes, setPurposes] = useState<Purpose[]>([]);
    const [catalog, setCatalog] = useState<DataCatalogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        required: false,
        required_data: [] as string[],
        validity_days: '' as any
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPurposes();
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const response = await dataCatalogApi.listCatalog();
            setCatalog(response.data);
        } catch (error) {
            console.error('Failed to fetch catalog:', error);
        }
    };

    const fetchPurposes = async () => {
        try {
            setLoading(true);
            const data = await purposeApi.getPurposes();
            setPurposes(data);
        } catch (error) {
            toast.error('Failed to fetch purposes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await purposeApi.createPurpose(formData);
            toast.success('Purpose created successfully');
            setIsModalOpen(false);
            setFormData({ 
                name: '', 
                description: '', 
                required: false, 
                required_data: [], 
                validity_days: '' as any
            });
            fetchPurposes();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create purpose');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this purpose? This will disable it for new consents.')) return;
        try {
            setIsDeleting(id);
            await purposeApi.deletePurpose(id);
            toast.success('Purpose deleted successfully');
            fetchPurposes();
        } catch (error) {
            toast.error('Failed to delete purpose');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Processing Purposes</h2>
                    <p className="text-slate-500 font-medium text-sm">Define why you collect and process user data.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95 space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Purpose</span>
                </button>
            </div>

            {/* Purposes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium font-bold">Loading purposes...</p>
                    </div>
                ) : purposes.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                        <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No purposes defined yet.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                        >
                            Create your first purpose
                        </button>
                    </div>
                ) : (
                    purposes.map((purpose) => (
                        <div key={purpose.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleDelete(purpose.id)}
                                        disabled={isDeleting === purpose.id}
                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting === purpose.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-slate-900">{purpose.name}</h3>
                                {purpose.required && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">REQUIRED</span>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                                {purpose.description || 'No description provided.'}
                            </p>
                            
                            {purpose.required_data && purpose.required_data.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {purpose.required_data.map(dataId => (
                                        <span key={dataId} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md border border-slate-200 uppercase">
                                            {dataId}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="block text-slate-300 mb-0.5">Validity</span>
                                    <span className="text-slate-600">{purpose.validity_days ? `${purpose.validity_days} Days` : 'No set limit'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center text-slate-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                Active
                            </div>
                            <span className="text-slate-400 font-bold">
                                ID: {purpose.id.substring(0, 8)}...
                            </span>
                        </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">New Purpose</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Purpose Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Marketing Analytics"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                    <textarea
                                        required
                                        placeholder="Briefly describe why this data is collected."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Validity (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Enter number of days"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.validity_days}
                                        onChange={(e) => setFormData({ ...formData, validity_days: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Required Data Elements</label>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto space-y-2">
                                        {catalog.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No data elements available in catalog.</p>
                                        ) : (
                                            catalog.map((entry) => (
                                                <div key={entry.id} className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`data-${entry.data_id}`}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                        checked={formData.required_data.includes(entry.data_id)}
                                                        onChange={(e) => {
                                                            const newData = e.target.checked
                                                                ? [...formData.required_data, entry.data_id]
                                                                : formData.required_data.filter(id => id !== entry.data_id);
                                                            setFormData({ ...formData, required_data: newData });
                                                        }}
                                                    />
                                                    <label htmlFor={`data-${entry.data_id}`} className="text-xs font-bold text-slate-700 cursor-pointer uppercase">
                                                        {entry.data_id}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <input
                                        type="checkbox"
                                        id="required"
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        checked={formData.required}
                                        onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                    />
                                    <label htmlFor="required" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                                        Mark as required for all users
                                    </label>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Purpose
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purposes;
