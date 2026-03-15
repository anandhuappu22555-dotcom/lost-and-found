import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import ItemMatches from './pages/ItemMatches';
import ClaimVerification from './pages/ClaimVerification';
import AdminClaims from './pages/AdminClaims';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/report/lost" element={<ReportLost />} />
              <Route path="/report/found" element={<ReportFound />} />
              <Route path="/matches/:itemId" element={<ItemMatches />} />
              <Route path="/claim/:claimId" element={<ClaimVerification />} />
              <Route path="/admin/claims" element={<AdminClaims />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Add more routes as needed */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
