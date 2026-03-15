import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Frontend Form Validations
        const emailLower = email.toLowerCase();
        if (!emailLower.endsWith('@gmail.com')) {
            return setError('For security, we only allow @gmail.com accounts. Please use a valid Google email.');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+-_.,])[A-Za-z\d@$!%*?&#+-_.,]{8,}$/;
        if (!passwordRegex.test(password)) {
            return setError('Password must be at least 8 characters and include a lowercase letter, uppercase letter, number, and symbol.');
        }

        const result = await register(username, email, password);
        if (result.success) {
            setMessage(result.message);
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Create Account</h2>

            {message && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-center border border-green-200">
                    <p>{message}</p>
                </div>
            )}

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {!message && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            autoComplete="new-password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
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
                    <button type="submit" className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        Sign Up
                    </button>
                </form>
            )}
            <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
            </div>
        </div>
    );
};

export default Register;
