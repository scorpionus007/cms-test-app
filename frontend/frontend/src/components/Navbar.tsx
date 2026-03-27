import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-24 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
            <div className="flex items-center">
                <Link to="/" className="flex items-center gap-1 cursor-pointer select-none border-none outline-none">
                    <span className="font-bold text-black text-xl tracking-tight leading-none h-full flex items-center">
                        Secure<span className="bg-black text-white px-1.5 py-0.5 rounded-md ml-0.5 text-[0.95em]">CMS</span>
                    </span>
                </Link>
            </div>
            <div className="flex items-center gap-6">
                <Link to="/login" className="text-gray-600 font-medium hover:text-black transition-colors hidden sm:block">Sign In</Link>
                <Link
                    to="/login"
                    className="bg-[#1a56db] hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors border-none outline-none text-center"
                >
                    Get Started
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
