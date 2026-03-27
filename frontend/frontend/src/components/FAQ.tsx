import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqData = [
    { question: "Is SecureCMS only a cookie consent tool?" },
    { question: "Does SecureCMS support Indian privacy regulations?" },
    { question: "Can SecureCMS integrate with existing tools?" },
    { question: "How long does implementation take?" },
    { question: "How much does SecureCMS cost?" },
    { question: "Is SecureCMS registered with India's Data Protection Board?" },
    { question: "What happens to our data if we switch providers?" }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-slate-50 py-16 px-6">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-12 text-center">
                    Frequently Asked Questions
                </h2>

                <div className="w-full space-y-4 mb-20">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg overflow-hidden transition-colors cursor-pointer"
                            onClick={() => toggleAccordion(index)}
                        >
                            <div className="flex justify-between items-center p-5">
                                <h3 className="text-slate-700 font-semibold text-base sm:text-lg">{faq.question}</h3>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            {/* If we had answers, they would go here. Since the screenshot only shows headers, we leave it closed/empty. */}
                            {openIndex === index && (
                                <div className="px-5 pb-5 text-slate-600 text-sm">
                                    <p>Content for {faq.question} goes here. This provides the detailed answer to the user's inquiry regarding the specific topic.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Call to Action pre-footer */}
                <div className="flex flex-col items-center pb-8 border-b border-transparent">
                    <p className="text-slate-600 mb-4 text-base">Still have a question?</p>
                    <button className="bg-[#1a56db] hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-sm">
                        Write to us
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
