import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, Shield, LayoutDashboard, TrendingUp, Users, Heart, Package, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Home = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ lost: 0, found: 0, completed: 0 });
    const [foundItems, setFoundItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('stats');
                setStats(res.data);
            } catch (err) {
                console.error('Stats error:', err);
            }
        };
        const fetchItems = async () => {
            try {
                const res = await api.get('items/found');
                setFoundItems(res.data);
            } catch (err) {
                console.error('Items error:', err);
            }
        };
        
        fetchStats();
        fetchItems();
    }, []);

    const filteredItems = foundItems.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.locationText && item.locationText.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-16">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-gradient-to-b from-indigo-50 to-white rounded-3xl mt-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
                        Reuniting People with <br />
                        <span className="text-indigo-600">What Matters</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
                        The most advanced AI-powered platform to identify and claim lost items securely.
                        Privacy-first, community-driven.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/report/lost" className="flex items-center gap-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200">
                            <Search size={24} />
                            I Lost Something
                        </Link>
                        <Link to="/report/found" className="flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold text-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm">
                            <PlusCircle size={24} />
                            I Found Something
                        </Link>
                    </div>
                </div>
            </section>

            {/* Live Community Dashboard Section */}
            <section className="px-4">
                <div className="text-center mb-10">
                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Live Community Dashboard</h2>
                    <p className="text-3xl font-black text-slate-900">Our Real-time Impact</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-indigo-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Search size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.lost}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Searches</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">People currently looking for their missing items in the area.</p>
                    </div>

                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-emerald-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.found}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Items Recovered</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">Verified items found by our community awaiting their owners.</p>
                    </div>

                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-purple-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.completed}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Successful Reunions</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">Happy endings achieved through our AI-powered verification logic.</p>
                    </div>
                </div>
            </section>

            {/* Public Directory - Search Found Items Section */}
            <section className="px-4 mb-20 animate-fade-in-up">
                <div className="text-center mb-10">
                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Public Directory</h2>
                    <p className="text-3xl font-black text-slate-900 mb-6">Search Reported Items</p>
                    
                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Think you might have lost something? Search any items here..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col">
                                <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                    {item.imageUrl ? (
                                        <img 
                                            src={`${import.meta.env.PROD ? 'https://lost-and-found-api-dewt.onrender.com' : (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000')}/${item.imageUrl}`} 
                                            alt={item.itemName} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
                                        />
                                    ) : (
                                        <Package size={48} className="text-slate-300" />
                                    )}
                                    <div className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm ${item.status === 'match_found' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                        {item.status === 'match_found' ? 'Match Pending' : 'Found'}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{item.itemName}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm font-medium mb-3 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                        <Package size={14} />
                                        {item.category}
                                    </div>
                                    <div className="space-y-2 mt-auto">
                                        {item.locationText && (
                                            <div className="flex items-start gap-2 text-slate-600 text-sm">
                                                <MapPin size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2">{item.locationText}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar size={16} className="text-indigo-400" />
                                            <span>
                                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <Link 
                                        to={user ? `/report/lost` : '/login'} 
                                        className="mt-6 w-full py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {user ? 'Report as Yours via AI' : 'Login to Claim'}
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Search size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No items found</h3>
                            <p className="text-slate-500 font-medium">We couldn't find any recently reported items matching your search.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
