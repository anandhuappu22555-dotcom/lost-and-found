import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, setAddress }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            fetchAddress(e.latlng.lat, e.latlng.lng);
        },
    });

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

// Controller to update map center and zoom
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 16);
        }
    }, [center, map]);
    return null;
}

const LocationPicker = ({ onLocationSelect }) => {
    const [position, setPosition] = useState(null);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    const handlePositionChange = (latlng) => {
        setPosition(latlng);
    };

    // Update parent when position or address changes
    useEffect(() => {
        if (position) {
            onLocationSelect({ ...position, address });
        }
    }, [position, address, onLocationSelect]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const selectLocation = (item) => {
        const latlng = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        setAddress(item.display_name);
        setPosition(latlng);
        setSearchQuery(item.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-4">
            <div className="relative" ref={searchRef}>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search any location worldwide..."
                            className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                        />
                    </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[2000] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                        {suggestions.map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-none"
                                onClick={() => selectLocation(item)}
                            >
                                <span className="mt-1 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                </span>
                                <span className="text-sm text-slate-700 line-clamp-2">{item.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-80 w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner relative group z-0">
                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={handlePositionChange}
                        setAddress={setAddress}
                    />
                    <MapController center={position} />
                </MapContainer>
                {!position && (
                    <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center pointer-events-none z-[1000]">
                        <span className="bg-white/90 backdrop-blur px-6 py-3 rounded-full text-slate-600 text-sm font-semibold shadow-xl border border-white/50 animate-pulse">
                            Search or click on the map to set location
                        </span>
                    </div>
                )}
            </div>

            {address && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3 items-start duration-200">
                    <div className="mt-1 text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Selected Location</p>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {address}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
