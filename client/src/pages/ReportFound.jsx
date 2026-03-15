import { useState } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import LocationPicker from '../components/ui/LocationPicker';
import { Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ReportFound = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        itemName: '',
        category: '',
        condition: '',
        storagePlace: '',
        finderPreference: 'meet',
        locationText: '',
    });
    const [location, setLocation] = useState(null);
    const [image, setImage] = useState(null);
    const [showMaskModal, setShowMaskModal] = useState(false);
    const [submittedItem, setSubmittedItem] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!image) return alert('Image is mandatory for found items');
        if (!location) return alert('Please select a specific location on the map where the item was found.');
        setShowMaskModal(true);
    };

    const processSubmit = async (shouldMask) => {
        setShowMaskModal(false);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });

        data.append('lat', location.lat);
        data.append('lng', location.lng);
        data.append('image', image);
        data.append('maskImage', shouldMask);

        try {
            const res = await api.post('items/found', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmittedItem(res.data);
        } catch (err) {
            console.error('Submission Error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Error submitting report';
            alert(`Error submitting report: ${errMsg}`);
        }
    };

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Login Required 🔒</h2>
                <p className="text-slate-500 mb-6 font-medium">You must be logged in to report a found item securely.</p>
                <div className="flex gap-4 justify-center">
                    <Link to="/login" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition">Sign In</Link>
                    <Link to="/register" className="bg-emerald-100 text-emerald-700 px-8 py-3 rounded-xl font-bold hover:bg-emerald-200 transition">Register</Link>
                </div>
            </div>
        );
    }

    if (submittedItem) {
        return (
            <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-lg border border-emerald-100 text-center mt-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} className="text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Item Reported Successfully!</h1>
                <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                    Thank you for reporting the found <b>{submittedItem.itemName}</b>! Your integrity helps our community. We have securely saved its details and will notify you when the owner tries to claim it.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
                    >
                        <Package size={18} /> Go to Dashboard
                    </button>
                    <button
                        onClick={() => setSubmittedItem(null)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <ShieldCheck size={18} /> Report Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Report Found Item</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name / Title</label>
                    <input
                        type="text"
                        name="itemName"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                        onChange={handleChange}
                        placeholder="e.g. Found iPhone 13, Blue Backpack"
                        value={formData.itemName}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select name="category" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Wallet">Wallet</option>
                        <option value="Keys">Keys</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Bag">Bag</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                    <select name="condition" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                        <option value="Good">Good</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Old">Old</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Storage Location</label>
                    <input type="text" name="storagePlace" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange} placeholder="e.g. Security Guard Desk, My Office" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Return Method</label>
                    <select name="finderPreference" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                        <option value="meet">Willing to Meet</option>
                        <option value="police">Dropped at Police/Security</option>
                        <option value="courier">Courier (Verified Only)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pin Location on Map</label>
                    <LocationPicker onLocationSelect={(loc) => {
                        setLocation(loc);
                        if (loc.address) {
                            setFormData(prev => ({ ...prev, locationText: loc.address }));
                        }
                    }} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specific Location Details</label>
                    <input
                        type="text"
                        name="locationText"
                        required
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50"
                        value={formData.locationText}
                        onChange={handleChange}
                        placeholder="Select location on map or type here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image (Mandatory)</label>
                    <input type="file" required onChange={(e) => setImage(e.target.files[0])} className="w-full" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                    Report Found Item
                </button>
            </form>

            {showMaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Masking</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Do you want to mask (blur) your image publicly? This ensures the real owner must verify it and protects against fraudulent claims.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={() => processSubmit(true)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
                                Yes, Mask Image
                            </button>
                            <button type="button" onClick={() => processSubmit(false)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
                                No, Keep Public
                            </button>
                            <button type="button" onClick={() => setShowMaskModal(false)} className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition mt-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportFound;
