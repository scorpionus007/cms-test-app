import useSWR from 'swr';
import { Database, Loader2, Info } from 'lucide-react';
import { dataCatalogApi, DataCatalogEntry } from '../api/dataCatalogApi';

export default function DataCatalog() {
    const { data, error, isLoading } = useSWR<{ data: DataCatalogEntry[] }>('dataCatalog', dataCatalogApi.listCatalog);

    const catalog = data?.data || [];

    if (error) {
        return <div className="p-8 text-center text-red-500">Failed to load data catalog.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Catalog</h1>
                    <p className="text-sm text-slate-500 mt-1">Platform-wide registry of discoverable data objects and elements.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : catalog.length === 0 ? (
                    <div className="text-center p-12 text-slate-500">
                        <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">No data entries available.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 whitespace-nowrap">
                                <tr>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Data ID</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Category</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Sensitivity</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Status</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {catalog.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{entry.data_id}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">Internal ID: {entry.id.split('-')[0]}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {entry.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                                entry.sensitivity === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                entry.sensitivity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                                {entry.sensitivity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                                entry.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                    : 'bg-slate-50 text-slate-700 border-slate-100'
                                            }`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs min-w-[250px]">
                                            <div className="flex items-start">
                                                <Info className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0 mt-0.5" />
                                                <span className="leading-relaxed font-medium">{entry.description || 'No description provided.'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
