import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Building2,
    Bell,
    ChevronRight,
    ShieldCheck,
    BookOpen,
    FileText,
    History,
    Webhook,
    UserCircle,
    Key,
    AppWindow,
    Database,
    Globe
} from 'lucide-react';
import useSWR from 'swr';
import { appsApi } from '../api/appsApi';
import { tenantApi } from '../api/tenantApi';
import { useAppStore } from '../store/appStore';

const DashboardLayout = () => {
    const { user, logout, tenantId, tenantMetadata, setTenantMetadata } = useAuthStore();
    const { selectedAppId, setSelectedAppId } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch apps
    const { data: appsData } = useSWR('tenant/apps', () => appsApi.listApps());
    const apps = appsData?.apps || [];

    // Fetch tenant metadata
    const { data: tenantData } = useSWR('tenant/me', () => tenantApi.getCurrentTenant());

    useEffect(() => {
        if (tenantData) {
            setTenantMetadata({
                organizationName: tenantData.organizationName,
                industry: tenantData.industry,
                country: tenantData.country
            });
        }
    }, [tenantData, setTenantMetadata]);

    // Set default app if none selected and apps exist
    useEffect(() => {
        if (!selectedAppId && apps.length > 0) {
            setSelectedAppId(apps[0].id);
        }
    }, [apps, selectedAppId, setSelectedAppId]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Apps', path: '/apps', icon: AppWindow },
        { label: 'Consents', path: '/consents', icon: ShieldCheck },
        { label: 'Purposes', path: '/purposes', icon: BookOpen },
        { label: 'Policy Versions', path: '/policy-versions', icon: FileText },
        { label: 'Clients', path: '/clients', icon: Users },
        { label: 'Data Catalog', path: '/data-catalog', icon: Database },
        { label: 'Webhooks', path: '/webhooks', icon: Webhook },
        { label: 'DSR Requests', path: '/dsr', icon: UserCircle },
        { label: 'Audit Logs', path: '/audit-logs', icon: History },
        { label: 'API Keys', path: '/api-keys', icon: Key },
        { label: 'Tenant Profile', path: '/tenant', icon: Settings },
    ];

    const getPageTitle = () => {
        const currentItem = navItems.find(item => item.path === location.pathname);
        return currentItem ? currentItem.label : 'Overview';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-sm shadow-indigo-200">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-900 tracking-tight">SecureCMS</span>
                </div>

                <nav className="flex-1 py-8 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`
                            }
                        >
                            <div className="flex items-center">
                                <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${location.pathname === item.path ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                {item.label}
                            </div>
                            {location.pathname === item.path && (
                                <ChevronRight className="w-4 h-4 text-indigo-400" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center space-x-3 mb-4 p-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate font-medium">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                    >
                        <LogOut className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400 group-hover:text-red-500" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pl-64">
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            {getPageTitle()}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-5">
                        {/* App Selector */}
                        <div className="flex items-center space-x-2 mr-2">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Managed App</span>
                            </div>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 z-10" />
                                <select
                                    value={selectedAppId || ''}
                                    onChange={(e) => setSelectedAppId(e.target.value)}
                                    className="pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none min-w-[140px]"
                                >
                                    <option value="" disabled>Select an App</option>
                                    {apps.map((app) => (
                                        <option key={app.id} value={app.id}>
                                            {app.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-5 mr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Tenant</span>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                {tenantMetadata?.organizationName || (tenantId ? tenantId.substring(0, 12) : 'No Tenant')}
                            </span>
                        </div>
                        <button className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-full transition-all duration-200 group">
                            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-transparent group-hover:ring-red-100 transition-all"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
