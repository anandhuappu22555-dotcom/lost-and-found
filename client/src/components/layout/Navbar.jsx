import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, PlusCircle, LogOut, LayoutDashboard } from 'lucide-react';
import NotificationCenter from '../ui/NotificationCenter';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                    You Lost. We Found.
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link to="/report/lost" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                                <Search size={18} />
                                I Lost Something
                            </Link>
                            <Link to="/report/found" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                                <PlusCircle size={18} />
                                I Found Something
                            </Link>

                            <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                                <LayoutDashboard size={18} />
                                Dashboard
                            </Link>


                            <div className="h-6 w-px bg-slate-200 mx-2"></div>

                            <NotificationCenter />

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                                <button onClick={handleLogout} className="text-slate-500 hover:text-red-600" title="Logout">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium">Sign In</Link>
                            <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
