const AboutCMS = () => {
    return (
        <section className="bg-slate-50 py-20 px-6">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
                    What is SecureCMS?
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 w-full text-slate-600 space-y-6 leading-relaxed">
                    <p>
                        SecureCMS is a centralised consent management system that allows organisations to collect,
                        store, update, and synchronise user consent and privacy preferences across their digital
                        ecosystem. It provides a single, auditable source of truth for consent data, ensuring that user
                        choices are respected consistently across all platforms and processing activities.
                    </p>

                    <p>
                        The platform supports compliance readiness for regulations such as GDPR, CCPA, CPRA, and
                        India's Digital Personal Data Protection (DPDP) Act by enabling lawful consent capture,
                        purpose-based controls, and traceable consent records.
                    </p>

                    <p>
                        SecureCMS is designed to be equally effective for legal, compliance, marketing, and
                        engineering teams, removing operational silos and simplifying privacy governance at scale.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default AboutCMS;
