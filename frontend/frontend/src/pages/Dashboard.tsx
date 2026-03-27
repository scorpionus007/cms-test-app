import { useEffect, useState } from 'react';
import {
    Users,
    ShieldCheck,
    FileText,
    Webhook,
    Clock,
    Loader2
} from 'lucide-react';
import { dashboardApi, DashboardStats } from '../api/dashboardApi';
import { auditApi } from '../api/auditApi';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, auditData] = await Promise.all([
                    dashboardApi.getDashboardStats(),
                    auditApi.getAuditLogs({ limit: 5 })
                ]);
                setStats(statsData);
                setActivities(auditData.logs || []);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const metricsList = [
        {
            title: 'Active Consents',
            value: stats?.active_consents ?? 0,
            trend: 'Live',
            trendUp: true,
            description: 'current active',
            icon: ShieldCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Open DSR Requests',
            value: stats?.open_dsr_requests ?? 0,
            trend: 'Priority',
            trendUp: false,
            description: 'pending action',
            icon: FileText,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            title: 'Registered Clients',
            value: stats?.registered_clients ?? 0,
            trend: 'Identity',
            trendUp: true,
            description: 'authorized access',
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            title: 'Active Webhooks',
            value: stats?.active_webhooks ?? 0,
            trend: 'Health',
            trendUp: true,
            description: 'real-time sync',
            icon: Webhook,
            color: 'text-slate-600',
            bg: 'bg-slate-50'
        },
    ];

    const getStatusColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('FAIL')) return 'bg-red-500';
        if (action.includes('CREATE') || action.includes('GRANT') || action.includes('SUCCESS')) return 'bg-emerald-500';
        if (action.includes('UPDATE')) return 'bg-amber-500';
        return 'bg-indigo-500';
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Welcome to your organization's dashboard</h2>
                    <p className="text-indigo-100 max-w-xl">
                        Monitor your system's health, manage privacy requests, and oversee client integrations from a single place.
                    </p>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricsList.map((metric, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${metric.bg} ${metric.color}`}>
                                <metric.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${
                                metric.trend === 'Live' ? 'bg-emerald-50 text-emerald-700' :
                                metric.trend === 'Health' ? 'bg-slate-100 text-slate-600' :
                                metric.trend === 'Priority' ? 'bg-amber-50 text-amber-700' :
                                'bg-indigo-50 text-indigo-700'
                            }`}>
                                {metric.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">{metric.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">{metric.value.toLocaleString()}</h3>
                            <p className="text-slate-400 text-xs font-medium">{metric.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900">Recent Activity</h3>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/audit-logs'}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        View all
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm font-medium">
                                        No recent activity logs.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity, i) => (
                                    <tr key={activity.id || i} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(activity.action)}`} />
                                                <span className="text-sm font-semibold text-slate-700">{activity.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold">
                                                {activity.actor_client_id ? activity.actor_client_id.substring(0, 13) + '...' : 'System'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-bold capitalize">
                                            {activity.resource_type}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                                            {new Date(activity.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
