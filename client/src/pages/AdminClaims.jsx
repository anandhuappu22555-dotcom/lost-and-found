import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Eye, Clock, AlertTriangle } from 'lucide-react';

const AdminClaims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const res = await api.get('admin/claims/pending');
                setClaims(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading pending reviews...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Shield className="text-indigo-600 w-8 h-8" /> Admin Moderation
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Review and verify ownership claims to ensure secure handovers.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2 text-amber-700">
                    <Clock size={18} />
                    <span className="font-bold">{claims.length} Pending Review</span>
                </div>
            </div>

            {claims.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">No Pending Claims</h2>
                    <p className="text-slate-500 mt-1">All claims have been processed. Great job!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {claims.map((claim) => (
                        <div key={claim.id} className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                                        {claim.foundItem.imageUrl ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${claim.foundItem.imageUrl}`}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                alt="Evidence"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Eye /></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-lg">{claim.foundItem.itemName || claim.foundItem.category}</h3>
                                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                ID: #{claim.id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Claimant: <span className="text-slate-700 font-semibold">{claim.claimer.username}</span>
                                            <span className="mx-2 opacity-30">|</span>
                                            Trust: <span className="text-emerald-600 font-bold">{claim.claimer.trustScore || 0}%</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="hidden lg:block text-right mr-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                                        <p className="text-sm font-medium text-slate-700">{new Date(claim.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Link
                                        to={`/claim/${claim.id}`}
                                        className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
                                    >
                                        <Eye size={18} /> Review Proof
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="text-amber-400" size={20} /> Security Protocol
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-lg">
                        Ensure and verify specific identifiers like serial numbers, secret marks, or inner compartment inventory before approving. Fraudulent claims harm community trust.
                    </p>
                </div>
                <div className="absolute -right-8 -bottom-8 text-white/5 pointer-events-none">
                    <Shield size={160} />
                </div>
            </div>
        </div>
    );
};

export default AdminClaims;
