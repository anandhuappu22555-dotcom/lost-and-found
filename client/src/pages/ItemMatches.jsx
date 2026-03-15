import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shield, MapPin, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { getVerificationQuestions } from '../utils/verificationQuestions';

const ItemMatches = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [lostItem, setLostItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [createdClaimId, setCreatedClaimId] = useState(null); // track the new claim

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch lost item details to get category
                const lostRes = await api.get(`items/lost/${itemId}`);
                setLostItem(lostRes.data);
            } catch (err) {
                console.error('Could not fetch lost item:', err);
            }

            try {
                const res = await api.post(`matches/match/${itemId}`, {});
                setMatches(res.data.matches || []);
            } catch (err) {
                console.error('Could not fetch matches:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [itemId]);

    const handleClaim = (foundItemId) => {
        setAnswers({});
        setResult(null);
        setVerifying(foundItemId);
    };

    const handleAnswerChange = (key, value) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const submitVerification = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Init Claim
            const claimRes = await api.post('claims/init', {
                lostItemId: parseInt(itemId),
                foundItemId: verifying
            });
            const newClaimId = claimRes.data.id;
            setCreatedClaimId(newClaimId);

            // 2. Submit Answers with category info
            const verifyRes = await api.post(`claims/verify/${newClaimId}`, {
                verificationData: {
                    category: lostItem?.category || 'Other',
                    ...answers
                }
            });

            if (verifyRes.data.claim?.status === 'verification_failed') {
                setResult('failed');
            } else {
                setResult('success');
            }
        } catch (err) {
            console.error(err);
            setResult('failed');
        } finally {
            setSubmitting(false);
        }
    };

    const questions = getVerificationQuestions(lostItem?.category || '');
    const category = lostItem?.category || 'Item';

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">🔍 Scanning for matches...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            {lostItem && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                    <Shield size={20} className="text-indigo-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800">Searching for: <span className="font-bold">{lostItem.itemName}</span></p>
                        <p className="text-xs text-indigo-600">Category: {lostItem.category} · If you click "This is mine", you'll answer <strong>{category}-specific</strong> questions.</p>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-slate-900 mb-6">Potential Matches Found</h2>

            {matches.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                    <p className="text-slate-600">No matches found yet. We will notify you when something similar is reported.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {matches.map(m => {
                        const { foundItem, score, details } = m;
                        return (
                            <div key={foundItem.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-48 h-48 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                    {foundItem.imageUrl ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/${foundItem.imageUrl}`}
                                                alt="Found Item"
                                                className="w-full h-full object-cover blur-sm"
                                            />
                                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                                <Shield size={24} className="text-white/50" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{foundItem.itemName || foundItem.category}</h3>
                                            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                                <MapPin size={16} /> Location: {foundItem.locationText || foundItem.locationFound || 'Nearby'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {score}% Match
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-slate-600">
                                        <span className="font-semibold">Condition:</span> {foundItem.condition || 'Unknown'} <br />
                                        <span className="font-semibold">Storage:</span> {foundItem.storagePlace || 'Unknown'}
                                    </p>

                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => handleClaim(foundItem.id)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                                            <Shield size={18} /> This is mine
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Verification Modal */}
            {verifying && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">

                        {result === 'success' ? (
                            <div className="text-center py-4">
                                <CheckCircle size={56} className="mx-auto text-emerald-500 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Sent to Finder! ✅</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Your answers have been sent to the finder for review. You'll be notified once they enable the chat.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate(`/claim/${createdClaimId}`)}
                                        className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        <MessageCircle size={18} />
                                        Track Claim &amp; Chat
                                    </button>
                                    <button onClick={() => { setVerifying(null); setResult(null); }} className="text-slate-400 text-sm hover:text-slate-600">
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : result === 'failed' ? (
                            <div className="text-center py-4">
                                <AlertTriangle size={56} className="mx-auto text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed ❌</h3>
                                <p className="text-slate-600 text-sm mb-6">Your answers did not match the original item record. If you believe this is an error, please contact support. The item search will continue.</p>
                                <button onClick={() => { setVerifying(null); setResult(null); }} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900">Verify Ownership</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Answer these <span className="font-semibold text-indigo-600">{category}-specific</span> questions. Only the real owner would know these details.
                                    </p>
                                </div>

                                <form onSubmit={submitVerification} className="space-y-5">
                                    {questions.map((q, i) => (
                                        <div key={q.key}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                Q{i + 1}. {q.label} {q.required && <span className="text-red-400">*</span>}
                                            </label>
                                            {q.type === 'textarea' ? (
                                                <textarea
                                                    onChange={e => handleAnswerChange(q.key, e.target.value)}
                                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-all outline-none resize-none h-20"
                                                    required={q.required}
                                                    placeholder={q.placeholder}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    onChange={e => handleAnswerChange(q.key, e.target.value)}
                                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-all outline-none"
                                                    required={q.required}
                                                    placeholder={q.placeholder}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setVerifying(null)} className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-700">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
                                        >
                                            {submitting ? 'Sending...' : 'Send to Finder →'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemMatches;
