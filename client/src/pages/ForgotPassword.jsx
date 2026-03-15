import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { forgotPassword } = useAuth();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        const result = await forgotPassword(email);
        setLoading(false);
        if (result.success) {
            setMessage(result.message);
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Reset Password</h2>
            <p className="text-slate-500 text-center mb-6">Enter your email and we'll send you a link to reset your password.</p>

            {message && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-center border border-green-200">
                    {message}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center border border-red-200">
                    {error}
                </div>
            )}

            {!message && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div className="mt-4 text-center text-sm text-slate-500">
                        Suddenly remembered? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Back to Login</Link>
                    </div>
                </form>
            )}

            {message && (
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">Return to Login</Link>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
