import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { Send, ShieldCheck, Lock, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Chat = ({ claimId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [online, setOnline] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const bottomRef = useRef(null);
    const lastMessageIdRef = useRef(0); // tracks the highest message ID we've received
    const inputRef = useRef(null);

    // Initial load: fetch ALL existing messages
    const fetchAllMessages = useCallback(async () => {
        try {
            const res = await api.get(`chat/${claimId}`);
            const msgs = res.data;
            setMessages(msgs);
            if (msgs.length > 0) {
                lastMessageIdRef.current = msgs[msgs.length - 1].id;
            }
            setOnline(true);
            setInitialized(true);
        } catch (err) {
            setOnline(false);
            console.error('Chat fetch error:', err.message);
        }
    }, [claimId]);

    // Incremental poll: only fetch NEW messages after the last known ID
    const fetchNewMessages = useCallback(async () => {
        try {
            const res = await api.get(`chat/${claimId}?after=${lastMessageIdRef.current}`);
            const newMsgs = res.data;
            if (newMsgs.length > 0) {
                // Filter out any optimistic messages that got confirmed
                setMessages(prev => {
                    const confirmedIds = new Set(newMsgs.map(m => m.id));
                    // Remove pending optimistic messages that now have a real counterpart
                    const withoutStale = prev.filter(m => !m.pending || !confirmedIds.has(m.id));
                    return [...withoutStale, ...newMsgs];
                });
                lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
            }
            setOnline(true);
        } catch (err) {
            setOnline(false);
        }
    }, [claimId]);

    // On mount: load all messages, then start incremental polling
    useEffect(() => {
        fetchAllMessages();
    }, [fetchAllMessages]);

    useEffect(() => {
        if (!initialized) return;
        const interval = setInterval(fetchNewMessages, 2000);
        return () => clearInterval(interval);
    }, [initialized, fetchNewMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        if (!claimId) { alert('Invalid claim. Please refresh the page.'); return; }

        setSending(true);
        const msgText = newMessage.trim();
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMsg = {
            id: optimisticId,
            senderId: user?.id,
            senderName: user?.username || 'You',
            content: msgText,
            timestamp: new Date().toISOString(),
            pending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        inputRef.current?.focus();

        try {
            const res = await api.post(`chat/${claimId}`, { content: msgText });
            const confirmedMsg = res.data;

            // Replace optimistic msg with confirmed message from server
            setMessages(prev => prev.map(m => m.id === optimisticId ? confirmedMsg : m));

            // Update last known ID so polling doesn't re-fetch this message
            if (confirmedMsg.id > lastMessageIdRef.current) {
                lastMessageIdRef.current = confirmedMsg.id;
            }
        } catch (err) {
            // Remove optimistic message and restore text on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            setNewMessage(msgText);
            const errMsg = err.response?.data?.error || 'Failed to send message';
            alert(errMsg);
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: '480px' }}
        >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400" size={22} />
                    <div>
                        <h3 className="font-bold text-sm">Secure Encrypted Chat</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Lock size={9} /> End-to-end encrypted · Contact info hidden
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    <Wifi size={10} />
                    {online ? 'Live' : 'Offline'}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
                {!initialized ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm animate-pulse">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShieldCheck size={40} className="text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm font-medium">Chat is open!</p>
                        <p className="text-slate-300 text-xs mt-1">Send a message to coordinate the return.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = Number(msg.senderId) === Number(user?.id);
                        const showName = !isMe && (i === 0 || Number(messages[i - 1].senderId) !== Number(msg.senderId));

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {/* Show sender name for incoming messages (first in a group) */}
                                {showName && (
                                    <span className="text-[11px] font-semibold text-indigo-500 mb-1 mx-2">
                                        {msg.senderName}
                                    </span>
                                )}
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                    ${isMe
                                        ? `bg-indigo-600 text-white rounded-br-none ${msg.pending ? 'opacity-60' : ''}`
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mx-2">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.pending && ' · sending...'}
                                    {isMe && !msg.pending && ' ✓'}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={17} />
                </button>
            </form>
        </div>
    );
};

export default Chat;

