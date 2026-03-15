import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const emailLower = email.toLowerCase();
        if (!emailLower.endsWith('@gmail.com')) {
            return setError('For security, we only allow @gmail.com accounts. Please use a valid Google email.');
        }

        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Welcome Back</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center border border-red-200">
                    {error}
                </div>
            )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        autoComplete="new-password"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        type="password"
                        required
                        autoComplete="new-password"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="text-right">
                    <Link to="/forgot-password" size="sm" className="text-xs text-indigo-600 hover:underline">
                        Forgot Password?
                    </Link>
                </div>

                <button type="submit" className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Sign In
                </button>
                <div className="mt-4 text-center text-sm text-slate-500">
                    Don't have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Sign up</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
