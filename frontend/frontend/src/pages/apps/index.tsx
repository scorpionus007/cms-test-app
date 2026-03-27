import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, AppWindow, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appsApi, AppConfig } from '../../api/appsApi';
import { AppModal } from '../../components/apps/AppModal';

export default function AppsList() {
    const { data, error, isLoading, mutate } = useSWR<{ apps: AppConfig[] }>('apps', appsApi.listApps);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<AppConfig | null>(null);

    const apps = data?.apps || [];

    const handleCreate = async (formData: any) => {
        try {
            await appsApi.createApp(formData);
            toast.success('App created successfully');
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create app');
            throw err;
        }
    };

    const handleUpdate = async (formData: any) => {
        if (!editingApp) return;
        try {
            await appsApi.updateApp(editingApp.id, formData);
            toast.success('App updated successfully');
            mutate();
            setEditingApp(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update app');
            throw err;
        }
    };

    const handleDelete = async (appId: string) => {
        if (!window.confirm('Are you sure you want to delete this app?')) return;
        try {
            await appsApi.deleteApp(appId);
            toast.success('App deleted successfully');
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to delete app');
        }
    };

    const openEditModal = (app: AppConfig) => {
        setEditingApp(app);
        setIsModalOpen(true);
    };

    const closeModals = () => {
        setIsModalOpen(false);
        setEditingApp(null);
    };

    if (error) {
        return <div className="p-8 text-center text-red-500">Failed to load apps.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Apps</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage software applications registered under your organization.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add App
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : apps.length === 0 ? (
                    <div className="text-center p-12 text-slate-500">
                        <AppWindow className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">No apps found</p>
                        <p className="text-sm">Click "Add App" to create your first application.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">App Name</th>
                                    <th className="px-6 py-4 font-medium">Slug</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Created Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {apps.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{app.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{app.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${app.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditModal(app)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block mr-2" title="Edit App">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(app.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Delete App">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AppModal
                isOpen={isModalOpen}
                onClose={closeModals}
                onSubmit={editingApp ? handleUpdate : handleCreate}
                initialData={editingApp}
                title={editingApp ? "Edit App" : "Create New App"}
            />
        </div>
    );
}
