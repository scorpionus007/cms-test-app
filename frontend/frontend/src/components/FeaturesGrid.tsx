
import {
    Building2, ShieldAlert, Database, Map,
    Library, Users, User, History,
    Lock, Settings, Baby, FileText,
    AlertTriangle, Server, Network, Lightbulb
} from 'lucide-react';

const featuresData = [
    {
        icon: <Building2 className="w-5 h-5 text-blue-600" />,
        title: 'Organization Management',
        description: 'Centralize user roles, departments, and access controls to ensure secure and accountable consent operations across your organization.'
    },
    {
        icon: <ShieldAlert className="w-5 h-5 text-blue-600" />,
        title: 'DPIA',
        description: 'Identify and mitigate privacy risks with structured DPIA workflows aligned to DPDPA and global data protection standards.'
    },
    {
        icon: <Database className="w-5 h-5 text-blue-600" />,
        title: 'Data Discovery',
        description: 'Automatically identify and classify personal data across systems to enable accurate consent mapping and lawful data processing.'
    },
    {
        icon: <Map className="w-5 h-5 text-blue-600" />,
        title: 'Data Mapping',
        description: 'Visualize how personal data flows across applications, vendors, and jurisdictions to support transparency and regulatory audits.'
    },
    {
        icon: <Library className="w-5 h-5 text-blue-600" />,
        title: 'Cataloguing',
        description: 'Maintain a centralized inventory of data assets, processing purposes, and consent requirements to strengthen compliance oversight.'
    },
    {
        icon: <Users className="w-5 h-5 text-blue-600" />,
        title: 'Preference Centre',
        description: 'Empower data principals to view, manage, and update their consent preferences through an intuitive web and mobile-friendly interface.'
    },
    {
        icon: <User className="w-5 h-5 text-blue-600" />,
        title: 'Principal Management',
        description: 'Manage data principal identities and consent histories securely while ensuring easy fulfillment of consent and privacy requests.'
    },
    {
        icon: <History className="w-5 h-5 text-blue-600" />,
        title: 'Legacy Consent',
        description: 'Migrate, validate, and govern previously collected consents to ensure continued compliance under DPDPA requirements.'
    },
    {
        icon: <Lock className="w-5 h-5 text-blue-600" />,
        title: 'Consent Governance',
        description: 'Define consent policies, approval workflows, and audit trails to ensure consistent and defensible consent practices.'
    },
    {
        icon: <Settings className="w-5 h-5 text-blue-600" />,
        title: 'DPO Operations',
        description: 'Support Data Protection Officers with dashboards, alerts, and reporting tools to manage compliance responsibilities efficiently.'
    },
    {
        icon: <Baby className="w-5 h-5 text-blue-600" />,
        title: 'Parental Consent',
        description: "Enable age-gating and verifiable parental consent mechanisms in line with DPDPA obligations for children's data."
    },
    {
        icon: <FileText className="w-5 h-5 text-blue-600" />,
        title: 'DPAR',
        description: 'Automate the intake, tracking, and resolution of data principal access and consent-related requests within statutory timelines.'
    },
    {
        icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
        title: 'PII Incident',
        description: 'Detect, document, and manage personal data incidents with structured workflows and audit-ready records.'
    },
    {
        icon: <Server className="w-5 h-5 text-blue-600" />,
        title: 'Data Processors',
        description: 'Maintain visibility and control over third-party processors handling personal data and associated consent obligations.'
    },
    {
        icon: <Network className="w-5 h-5 text-blue-600" />,
        title: 'Downstreams',
        description: 'Track how consent choices propagate across downstream systems, integrations, and partners.'
    },
    {
        icon: <Lightbulb className="w-5 h-5 text-blue-600" />,
        title: 'Awareness',
        description: 'Promote internal privacy awareness through documentation, policies, and role-based guidance to strengthen compliance culture.'
    }
];

const FeaturesGrid = () => {
    return (
        <section className="bg-slate-50 py-20 px-6">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center leading-tight">
                    Structured Consent Management.<br className="hidden md:block" /> Seamless DPDPA Compliance.
                </h2>
                <p className="text-slate-600 text-center max-w-3xl mb-16 text-base md:text-lg">
                    SecureCMS provides a comprehensive, modular Consent Management System designed to
                    help organizations operationalize <span className="font-semibold text-slate-700">DPDPA compliance</span>, strengthen privacy governance, and
                    scale data protection programs with ease.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {featuresData.map((feature, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-5">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
