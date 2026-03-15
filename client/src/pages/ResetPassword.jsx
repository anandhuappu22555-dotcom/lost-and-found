import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match");
        }

        if (newPassword.length < 6) {
            return setError("Password must be at least 6 characters long");
        }

        setLoading(true);
        const result = await resetPassword(token, newPassword);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setError(result.error);
        }
    };

    if (!token) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-100 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
                <p className="text-slate-600 mb-6">This password reset link is missing or malformed.</p>
                <Link to="/forgot-password" title="Go back" className="text-indigo-600 font-medium hover:underline">Request a new link</Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">New Password</h2>

            {success ? (
                <div className="text-center">
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 border border-green-200">
                        Password reset successfully! Redirecting to login...
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-slate-500 text-center mb-6">Enter your new password below.</p>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center border border-red-200">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ResetPassword;
