import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Package, Shield, Search, ChevronRight, Clock, CheckCircle2, XCircle, MessageCircle, Eye, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ lostCount: 0, foundCount: 0, claimCount: 0, pendingReviews: 0 });
    const [recentLost, setRecentLost] = useState([]);
    const [recentClaims, setRecentClaims] = useState([]);
    const [finderClaims, setFinderClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedClaim, setExpandedClaim] = useState(null);

    const fetchDashboardData = async () => {
        try {
            const [myItemsRes, claimsRes, finderClaimsRes] = await Promise.all([
                api.get('items/my-items'),
                api.get('claims/my-claims'),
                api.get('claims/finder-claims')
            ]);

            const myLost = myItemsRes.data.lost || [];
            const myFound = myItemsRes.data.found || [];
            const fc = finderClaimsRes.data || [];

            setRecentLost(myLost);
            setRecentClaims(claimsRes.data || []);
            setFinderClaims(fc);
            setStats({
                lostCount: myLost.length,
                foundCount: myFound.length,
                claimCount: (claimsRes.data || []).length,
                pendingReviews: fc.filter(c => c.status === 'finder_review').length
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchDashboardData();
    }, [user?.id]);

    const handleFinderAction = async (claimId, action) => {
        setActionLoading(claimId + action);
        try {
            await api.post(`claims/${claimId}/finder-action`, { action });
            if (action === 'approve') {
                // Take the finder directly to the chat page
                navigate(`/claim/${claimId}`);
            } else {
                await fetchDashboardData();
                setExpandedClaim(null);
            }
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Preparing your dashboard...</div>;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'finder_review': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'completed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {user.username}!</h1>
                <p className="text-slate-500 font-medium">Here's what's happening with your items and claims.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Search size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lost</p>
                        <p className="text-2xl font-black text-slate-900">{stats.lostCount}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Package size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Found</p>
                        <p className="text-2xl font-black text-slate-900">{stats.foundCount}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Shield size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Claims</p>
                        <p className="text-2xl font-black text-slate-900">{stats.claimCount}</p>
                    </div>
                </div>
                <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-3 ${stats.pendingReviews > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.pendingReviews > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}><UserCheck size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Review</p>
                        <p className="text-2xl font-black text-slate-900">{stats.pendingReviews}</p>
                    </div>
                </div>
            </div>

            {/* FINDER REVIEW SECTION — Claims awaiting finder's decision */}
            {finderClaims.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserCheck className="text-amber-500" />
                        Ownership Claims on Your Found Items
                        {stats.pendingReviews > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {stats.pendingReviews} pending
                            </span>
                        )}
                    </h2>
                    <div className="space-y-4">
                        {finderClaims.map(claim => {
                            const verData = (() => {
                                try { return JSON.parse(claim.verificationData || '{}'); }
                                catch { return {}; }
                            })();
                            const isExpanded = expandedClaim === claim.id;
                            return (
                                <div key={claim.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${claim.status === 'finder_review' ? 'border-amber-200' : 'border-slate-100'}`}>
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                {claim.claimer?.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">
                                                    <span className="text-indigo-600">{claim.claimer?.username}</span> claims your {claim.foundItem?.itemName || claim.foundItem?.category}
                                                </h4>
                                                <p className="text-xs text-slate-400">{new Date(claim.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(claim.status)}`}>
                                                {claim.status.replace('_', ' ')}
                                            </span>
                                            {claim.status === 'finder_review' && (
                                                <button
                                                    onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                                                    className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-lg"
                                                >
                                                    <Eye size={15} /> {isExpanded ? 'Hide' : 'Review Answers'}
                                                </button>
                                            )}
                                            {claim.status === 'approved' && (
                                                <Link to={`/claim/${claim.id}`} className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-lg">
                                                    <MessageCircle size={15} /> Open Chat
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Verification Answers */}
                                    {isExpanded && claim.status === 'finder_review' && (
                                        <div className="border-t border-amber-100 bg-amber-50 p-5">
                                            <h5 className="text-sm font-bold text-amber-800 mb-3">📋 Their Verification Answers</h5>
                                            <div className="space-y-2 mb-5">
                                                {Object.entries(verData).filter(([k]) => k !== 'category').map(([key, val]) => (
                                                    <div key={key} className="bg-white rounded-xl p-3 border border-amber-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                                                        <p className="text-sm font-medium text-slate-800 mt-0.5">{val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-amber-700 mb-4">
                                                ⚡ If these answers match what you know about the item, enable chat to coordinate the return securely.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleFinderAction(claim.id, 'approve')}
                                                    disabled={actionLoading === claim.id + 'approve'}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                                >
                                                    <MessageCircle size={16} />
                                                    {actionLoading === claim.id + 'approve' ? 'Enabling...' : 'Enable Chat 🔓'}
                                                </button>
                                                <button
                                                    onClick={() => handleFinderAction(claim.id, 'reject')}
                                                    disabled={actionLoading === claim.id + 'reject'}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-all"
                                                >
                                                    <XCircle size={16} />
                                                    {actionLoading === claim.id + 'reject' ? 'Rejecting...' : 'Reject Claim'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* My Lost Items */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-indigo-500" /> My Lost Reports
                        </h2>
                        <Link to="/report/lost" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">+ New Report</Link>
                    </div>
                    <div className="space-y-4">
                        {recentLost.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                                No lost items reported yet.
                            </div>
                        ) : recentLost.map(item => (
                            <Link key={item.id} to={`/matches/${item.id}`} className="block group bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                                            {item.imageUrl ? <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${item.imageUrl}`} className="w-full h-full object-cover" alt="" /> : <Package />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.itemName || item.category}</h4>
                                            <p className="text-xs text-slate-400">Reported {new Date(item.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* My Ownership Claims */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Shield className="text-emerald-500" /> My Ownership Claims
                    </h2>
                    <div className="space-y-4">
                        {recentClaims.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                                No active claims yet.
                            </div>
                        ) : recentClaims.map(claim => (
                            <Link key={claim.id} to={`/claim/${claim.id}`} className="block group bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Claim for {claim.foundItem?.itemName || claim.foundItem?.category}</h4>
                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(claim.status)}`}>
                                            {claim.status === 'approved' && <CheckCircle2 size={12} />}
                                            {claim.status === 'rejected' && <XCircle size={12} />}
                                            {claim.status.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
