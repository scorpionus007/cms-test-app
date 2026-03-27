import { Shield, Zap, Lock } from 'lucide-react';

const features = [
    {
        title: 'DPDP Act Compliant',
        description: 'Ensures verifiability, auditability, and privacy compliance as per the Digital Personal Data Protection Act, 2023.',
        icon: <Shield className="w-6 h-6 text-white" />,
        iconBg: 'bg-blue-600',
        iconShadow: 'shadow-blue-200',
    },
    {
        title: 'Seamless Integration',
        description: 'Modular architecture enabling Data Fiduciaries to integrate consent processes efficiently and securely.',
        icon: <Zap className="w-6 h-6 text-white" />,
        iconBg: 'bg-orange-500',
        iconShadow: 'shadow-orange-200',
    },
    {
        title: 'User-Centric Design',
        description: 'Empowers Data Principals to manage their entire consent lifecycle with complete control and transparency.',
        icon: <Lock className="w-6 h-6 text-white" />,
        iconBg: 'bg-teal-500',
        iconShadow: 'shadow-teal-200',
    },
];

const FeatureCards = () => {
    return (
        <section className="bg-slate-50 py-20 px-6 relative overflow-hidden">
            {/* Decorative background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-0">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="group bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`${feature.iconBg} ${feature.iconShadow} w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                            {feature.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-base lg:text-lg">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeatureCards;
