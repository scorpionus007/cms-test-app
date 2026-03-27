import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section className="bg-slate-50 pt-20 pb-16 px-6 text-center flex flex-col items-center">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-3">
                    Enterprise-Grade Consent Management for 
                </h1>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f97316] tracking-tight mb-6">
                    DPDP Compliance
                </h2>

                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
                    Securely manage user consent, data subject requests, and regulatory compliance with a multi-tenant Consent-as-a-Service platform built for modern applications.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <Link
                        to="/login"
                        className="w-full sm:w-auto bg-[#1a56db] hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors border-none outline-none text-center"
                    >
                        Start Your Journey
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </Link>
                    <Link
                        to="/login"
                        className="w-full sm:w-auto bg-white hover:bg-gray-50 text-slate-800 font-semibold py-3.5 px-8 rounded-lg border border-gray-200 shadow-sm transition-colors text-center"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
