

const Footer = () => {
    return (
        <footer className="bg-[#1a56db] text-white pt-16 pb-6 px-6 relative">
            <div className="max-w-7xl mx-auto">

                {/* Top section with Logo, Socials, and Links */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 mb-16">

                    {/* Brand & Socials (takes 4 cols on large screens) */}
                    <div className="lg:col-span-4 flex flex-col items-start pt-2">
                        <div className="flex items-center gap-1 mb-8">
                            <span className="font-bold text-black text-xl tracking-tight leading-none bg-white rounded flex items-center px-1.5 py-1">
                                Secure<span className="bg-black text-white px-1.5 py-0.5 rounded-md ml-0.5 text-[0.95em]">CMS</span>
                            </span>
                        </div>

                        <div className="flex gap-4">
                            {/* X / Twitter */}
                            <a href="#" className="text-white hover:text-gray-200 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" className="text-white hover:text-gray-200 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                            </a>
                            {/* Telegram */}
                            <a href="#" className="text-white hover:text-gray-200 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a5.96 5.96 0 0 0-.207.01h-.011zm-4.485 16.59l1.166-3.832c.162.247 1.054 1.583 2.95 3.012l.144-.067c2.585-1.218 5.76-6.425 6.471-9.356.19-1.205-.516-1.531-1.353-1.127l-8.683 4.298c-1.22.62-1.21 1.18-.216 1.487l2.257.697-.333 2.292c.168.046.29.076.368.093l-.771 2.503zm3.743-4.205l-1.373.965.253-1.688 4.256-4.2c.404-.396-.134-.148-.596.17l-5.65 3.65-.968-3.393z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Grid: takes 8 cols */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">

                        {/* Product Column */}
                        <div className="flex flex-col">
                            <h4 className="text-white font-bold mb-6 text-lg">Product</h4>
                            <ul className="space-y-4 text-sm text-blue-100 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Solidity Shield Scan</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Secure Watch</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Secure CMS (Consent)</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Audit Express</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Secure Trace</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Secure Pad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">PQC Suite</a></li>
                            </ul>
                        </div>

                        {/* Services Column */}
                        <div className="flex flex-col">
                            <h4 className="text-white font-bold mb-6 text-lg">Services</h4>
                            <ul className="space-y-4 text-sm text-blue-100 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Audit</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Regulatory Solutions</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Training & Education</a></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div className="flex flex-col">
                            <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
                            <ul className="space-y-4 text-sm text-blue-100 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Authors</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Media</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Career</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-blue-500 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200">
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                        <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
                    </div>
                    <div className="text-center md:text-right">
                        © 2024, Vettedcode Technologies India Pvt. Ltd.. All rights reserved
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
