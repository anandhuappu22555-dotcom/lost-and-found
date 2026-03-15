import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Clock, CheckCircle2, XCircle, MessageCircle, Eye, UserCheck } from 'lucide-react';
import Chat from '../components/chat/Chat';
import { useAuth } from '../context/AuthContext';

const ClaimVerification = () => {
    const { claimId } = useParams();
    const { user } = useAuth();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchClaim = async () => {
        try {
            const res = await api.get(`claims/${claimId}`);
            setClaim(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaim();
        // Poll claim status every 5 seconds so both sides update automatically
        const interval = setInterval(fetchClaim, 5000);
        return () => clearInterval(interval);
    }, [claimId]);

    const handleFinderAction = async (action) => {
        setActionLoading(true);
        try {
            await api.post(`claims/${claimId}/finder-action`, { action });
            await fetchClaim();
        } catch (err) {
            alert(err.response?.data?.error || 'Error performing action');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Loading claim details...</p>
            </div>
        </div>
    );

    if (!claim) return <div className="p-8 text-center text-red-500">Claim not found or access denied.</div>;

    const verData = (() => { try { return JSON.parse(claim.verificationData || '{}'); } catch { return {}; } })();
    const isFinder = claim.foundItem?.finderId === user?.id;
    const isClaimer = claim.claimerId === user?.id;
    const isApproved = claim.status === 'approved' || claim.status === 'completed';
    const isPendingFinderReview = claim.status === 'finder_review';
    const isRejected = claim.status === 'rejected';

    const statusConfig = {
        verification_pending: { label: 'Verification Pending', color: 'bg-slate-100 text-slate-600', icon: Clock },
        finder_review: { label: 'Awaiting Finder Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
        approved: { label: 'Approved — Chat Unlocked', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
        completed: { label: 'Completed', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle2 },
    };
    const status = statusConfig[claim.status] || statusConfig.verification_pending;
    const StatusIcon = status.icon;

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="text-indigo-600" size={24} />
                            {isFinder ? 'Ownership Claim on Your Item' : 'Your Claim Status'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isFinder
                                ? `Someone claims your found "${claim.foundItem?.itemName || claim.foundItem?.category}"`
                                : `You claimed "${claim.foundItem?.itemName || claim.foundItem?.category}"`}
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                        <StatusIcon size={13} />
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Verification Answers — visible to finder when reviewing, and always to both after */}
            {(isFinder || isApproved) && Object.keys(verData).length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserCheck size={18} className="text-indigo-500" />
                        Verification Answers
                        {verData.category && (
                            <span className="ml-2 text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                {verData.category} category
                            </span>
                        )}
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(verData)
                            .filter(([k]) => k !== 'category')
                            .map(([key, val]) => (
                                <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm font-medium text-slate-800 mt-0.5">{val || '—'}</p>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* FINDER ACTIONS — only shown to finder when pending their review */}
            {isFinder && isPendingFinderReview && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h2 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <Eye size={18} /> Your Decision
                    </h2>
                    <p className="text-sm text-amber-700 mb-5">
                        Review the answers above. If they match what you know about the item, enable chat to coordinate the return securely.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleFinderAction('approve')}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                            <MessageCircle size={18} />
                            {actionLoading ? 'Enabling...' : '🔓 Enable Chat'}
                        </button>
                        <button
                            onClick={() => handleFinderAction('reject')}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-red-600 font-bold border-2 border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all"
                        >
                            <XCircle size={18} />
                            {actionLoading ? 'Rejecting...' : 'Reject Claim'}
                        </button>
                    </div>
                </div>
            )}

            {/* CLAIMER WAITING — shown to claimer while finder is reviewing */}
            {isClaimer && isPendingFinderReview && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <h3 className="font-bold text-amber-800">Waiting for Finder's Review</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        The finder has been notified and is reviewing your answers. This page will update automatically.
                    </p>
                </div>
            )}

            {/* REJECTED */}
            {isRejected && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                    <h3 className="font-bold text-red-800">Claim Rejected</h3>
                    <p className="text-sm text-red-700 mt-1">
                        {isFinder
                            ? 'You rejected this claim. The item is back to active.'
                            : 'The finder rejected your claim. If you believe this is wrong, contact support.'}
                    </p>
                </div>
            )}

            {/* CHAT — shown to both when approved */}
            {isApproved && (
                <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                        <p className="text-emerald-700 font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} />
                            {isFinder ? 'You approved this claim — chat is open!' : 'Finder approved your claim — chat is open!'}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">Messages are end-to-end encrypted. Use this to arrange the handover.</p>
                    </div>
                    <Chat claimId={parseInt(claimId)} />
                </div>
            )}

        </div>
    );
};

export default ClaimVerification;
