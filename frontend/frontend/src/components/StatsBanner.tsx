const StatsBanner = () => {
    return (
        <section className="bg-[#1e40af] text-white py-16 px-6 relative w-full overflow-hidden">
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                    Why Consent & Preference<br className="hidden md:block" /> Management Is Essential for DPDP<br className="hidden md:block" /> Compliance
                </h2>

                <p className="text-blue-100 text-base md:text-lg mb-10 max-w-3xl leading-relaxed">
                    A robust Consent Management System like <span className="font-bold text-white">SecureCMS</span> enables organizations to collect,
                    manage, and honor user consent transparently while meeting the requirements of India's
                    Digital Personal Data Protection Act (DPDPA) and global privacy laws.
                </p>

                {/* Stats Card */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-10 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/20">
                        <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
                            <span className="text-4xl md:text-5xl font-bold mb-2">10K+</span>
                            <span className="text-blue-100 text-sm font-medium">Consents Managed</span>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
                            <span className="text-4xl md:text-5xl font-bold mb-2">99.9%</span>
                            <span className="text-blue-100 text-sm font-medium">Uptime Guarantee</span>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
                            <span className="text-4xl md:text-5xl font-bold mb-2">100%</span>
                            <span className="text-blue-100 text-sm font-medium">DPDP Compliant</span>
                        </div>
                    </div>
                </div>

                <button className="bg-white hover:bg-gray-50 text-[#1a56db] font-semibold py-3 px-8 rounded-lg transition-colors">
                    Request a Demo
                </button>
            </div>
        </section>
    );
};

export default StatsBanner;
