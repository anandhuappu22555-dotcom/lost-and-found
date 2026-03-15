import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Bell, Check, Mail, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new matches
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`notifications/read/${id}`, {});
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('notifications/read-all', {});
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-500 hover:text-indigo-600 relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-white font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100]">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell size={20} className="text-slate-400" />
                                </div>
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'match' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            {notification.type === 'match' ? <Check size={16} /> : <Mail size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm font-semibold text-slate-900 ${!notification.read ? 'pr-4' : ''}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="absolute top-4 right-4 h-2 w-2 bg-indigo-500 rounded-full"
                                                        title="Mark as read"
                                                    />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </span>
                                                {notification.link && (
                                                    <Link
                                                        to={notification.link.replace(/^https?:\/\/[^/]+/, '')}
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            markAsRead(notification.id);
                                                        }}
                                                        className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                                                    >
                                                        Details <ExternalLink size={10} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
                        <Link
                            to="/notifications"
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            See all activity
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
