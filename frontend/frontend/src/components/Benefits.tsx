
import { ShieldCheck, Users, Award, Zap, Globe } from 'lucide-react';

const benefitsData = [
    {
        icon: <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />,
        iconBg: 'bg-[#2563eb]', // Blue
        title: 'Regulatory Compliance',
        subtitle: 'Meet DPDPA and Global Privacy Requirements with Confidence',
        description: "SecureCMS enables organizations to collect, manage, and document user consent in accordance with data protection laws such as India's Digital Personal Data Protection Act (DPDPA), GDPR, CCPA, and other global regulations. By ensuring lawful consent collection and auditable records, businesses can reduce compliance risks and avoid regulatory penalties."
    },
    {
        icon: <Users className="w-6 h-6 text-white" strokeWidth={2} />,
        iconBg: 'bg-[#0d9488]', // Teal/Green
        title: 'Build User Trust',
        subtitle: 'Give Users Transparency and Control Over Their Data',
        description: "With SecureCMS, users clearly understand how their personal data is collected, processed, and used. Granular consent and preference controls empower individuals to manage their choices easily—strengthening trust, improving engagement, and fostering long-term customer relationships."
    },
    {
        icon: <Award className="w-6 h-6 text-white" strokeWidth={2} />,
        iconBg: 'bg-[#ea580c]', // Orange 
        title: 'Reputation',
        subtitle: 'Strengthen Your Brand Through Responsible Data Practices',
        description: "Adopting a structured consent and preference management approach demonstrates your organization's commitment to privacy and ethical data handling. SecureCMS helps establish a strong internal privacy culture that enhances brand reputation, increases stakeholder confidence, and positions your business as a trusted data custodian."
    },
    {
        icon: <Zap className="w-6 h-6 text-white" strokeWidth={2} />,
        iconBg: 'bg-[#a855f7]', // Purple
        title: 'Operational Efficiency',
        subtitle: 'Automate Consent Workflows and Reduce Manual Effort',
        description: "SecureCMS centralizes consent and preference management across channels, eliminating fragmented processes and manual tracking. Automated workflows and dashboards help teams operate more efficiently, respond faster to user requests, and focus on business-critical priorities."
    },
    {
        icon: <Globe className="w-6 h-6 text-white" strokeWidth={2} />,
        iconBg: 'bg-[#059669]', // Green
        title: 'Global Reach',
        subtitle: 'Manage Consent Across Regions Without Complexity',
        description: "Whether operating in India or expanding globally, SecureCMS supports jurisdiction-specific consent requirements. Our platform adapts to regional privacy laws, enabling seamless compliance across borders while maintaining consistent user experiences."
    }
];

const Benefits = () => {
    return (
        <section className="bg-slate-50 py-16 px-6">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
                    Why Consent & Preference Management Is Necessary
                </h2>
                <p className="text-slate-600 text-center max-w-3xl mb-12 text-base md:text-lg">
                    An effective Consent & Preference Management system is essential for organizations to meet
                    <span className="font-semibold text-slate-700"> DPDPA obligations</span>, build user trust,
                    and manage personal data responsibly in today's privacy-first digital ecosystem.
                </p>

                <div className="w-full space-y-6">
                    {benefitsData.map((benefit, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col sm:flex-row gap-6">
                            <div className="flex-shrink-0">
                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${benefit.iconBg}`}>
                                    {benefit.icon}
                                </div>
                            </div>
                            <div className="flex-col">
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{benefit.title}</h3>
                                <h4 className="text-sm font-bold text-slate-700 mb-3">{benefit.subtitle}</h4>
                                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                    {benefit.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Benefits;
