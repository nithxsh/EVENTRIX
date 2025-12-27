import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import { CertificateEditor } from '../components/CertificateEditor';
import { SimpleRichEditor } from '../components/SimpleRichEditor';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// Icons using Lucide React
import { Download, FileSpreadsheet, Settings, X, Link, Workflow, LayoutDashboard, ExternalLink, LayoutTemplate, Users, CheckSquare, Square, Search, RefreshCw, ChevronUp, ChevronDown, CheckCircle2, ClipboardCheck, Clipboard, ShieldCheck, ShieldAlert, Users2, Zap, MonitorPlay } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const EventDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<'create' | 'registrations' | 'automation' | 'protocols'>('create');

    // Form State
    const [formUrl, setFormUrl] = useState('');
    const [regType, setRegType] = useState<'google' | 'tally' | 'none'>('google');
    const [sheetId, setSheetId] = useState('');
    const [tallyUrl, setTallyUrl] = useState('');

    // Registration Advanced State
    const [regEnabled, setRegEnabled] = useState(true);
    const [regLimit, setRegLimit] = useState<number | ''>('');
    const [copied, setCopied] = useState(false);
    const [qrContent, setQrContent] = useState('');
    const [qrColor, setQrColor] = useState('#000000');
    const [qrActiveTab, setQrActiveTab] = useState<'content' | 'style'>('content');

    // Data State
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loadingRegs, setLoadingRegs] = useState(false);

    // Automation State
    const [recipientSource, setRecipientSource] = useState<'live' | 'upload'>('live');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [certLayout, setCertLayout] = useState<any>(null); // Store coordinates
    const [emailType, setEmailType] = useState<'certificate' | 'update'>('certificate');
    const [certTemplateFile, setCertTemplateFile] = useState<File | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [sending, setSending] = useState(false);

    // Recipient Selection State
    const [showRecipientModal, setShowRecipientModal] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [recipientSearch, setRecipientSearch] = useState('');

    // Attendee Database State
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [showGallery, setShowGallery] = useState(false);

    const templates = [
        { name: 'Modern Blue', url: '/templates/Modern.png' },
        { name: 'Classic Gold', url: '/templates/Classic.png' },
        { name: 'Corporate', url: '/templates/Corporate.png' },
    ];

    useEffect(() => {
        // Fetch user info
        axios.get('http://localhost:5000/auth/me', { withCredentials: true })
            .then(res => setUser(res.data))
            .catch(err => console.error("Auth error:", err));

        // Fetch event info
        fetchEvent();
    }, [id]);

    const fetchEvent = () => {
        axios.get(`http://localhost:5000/api/events/${id}`)
            .then(res => {
                setEvent(res.data);
                setFormUrl(res.data.registrationFormUrl || '');
                setRegType(res.data.registrationType || 'google');
                setSheetId(res.data.googleSheetId || '');
                setTallyUrl(res.data.tallyEndpoint || '');
                setCollegeName(res.data.collegeName || '');
                setCertLayout(res.data.certificateLayout || null);
                setRegEnabled(res.data.registrationEnabled ?? true);
                setRegLimit(res.data.registrationLimit || '');
                setQrContent(res.data.registrationFormUrl || '');
                setSubject(`Certificate of Participation for ${res.data.title}`);
                setMessage(`Hello {{Name}},

Thank you for participating in {{Event}}!

We are excited to share your certificate of participation. Please find it attached to this email.

Best regards,
The {{Event}} Team`);
            })
            .catch(err => console.error("Event fetch error:", err));
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById('qr-svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${event.title}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const fetchRegistrations = () => {
        setLoadingRegs(true);
        axios.get(`http://localhost:5000/api/events/${id}/registrations`, { withCredentials: true })
            .then(res => setRegistrations(res.data))
            .catch(err => console.error("Regs error:", err))
            .finally(() => setLoadingRegs(false));
    };

    // Auto-fetch registrations when event is loaded or Google Sheet ID changes
    useEffect(() => {
        if (event && event.id) {
            fetchRegistrations();
        }
    }, [event?.id, event?.googleSheetId]);

    const handleUpdate = () => {
        const updates = {
            registrationFormUrl: formUrl,
            registrationType: regType,
            googleSheetId: sheetId,
            tallyEndpoint: tallyUrl,
            registrationEnabled: regEnabled,
            collegeName: collegeName,
            certificateLayout: certLayout,
            registrationLimit: regLimit === '' ? undefined : Number(regLimit)
        };

        axios.put(`http://localhost:5000/api/events/${id}`, updates, { withCredentials: true })
            .then(res => {
                setEvent(res.data);
                alert("Settings updated!");
            })
            .catch(err => {
                console.error("Update error:", err);
                alert("Failed to update settings");
            });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(formUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveLayout = (layout: any) => {
        console.log("Layout saved locally:", layout);
        setCertLayout(layout);

        // Persist immediately to prevent loss
        axios.put(`http://localhost:5000/api/events/${id}`, { certificateLayout: layout, collegeName }, { withCredentials: true })
            .then(res => {
                setEvent(res.data);
                alert("Visual Protocol Synchronized!");
            })
            .catch(err => console.error("Layout save error:", err));
    };

    const handleToggleSelect = (email: string) => {
        const newSelected = new Set(selectedEmails);
        if (newSelected.has(email)) newSelected.delete(email);
        else newSelected.add(email);
        setSelectedEmails(newSelected);
    };

    const handleSelectAll = (filteredRegs: any[]) => {
        const allSelected = filteredRegs.every(r => selectedEmails.has(r.email));
        const newSelected = new Set(selectedEmails);
        filteredRegs.forEach(r => {
            if (allSelected) newSelected.delete(r.email);
            else newSelected.add(r.email);
        });
        setSelectedEmails(newSelected);
    };

    const handleSendEmail = async () => {
        if (!confirm("Are you sure you want to send emails to all recipients? This cannot be undone.")) return;

        setSending(true);
        const formData = new FormData();
        formData.append('emailType', emailType);
        formData.append('recipientSource', recipientSource);
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('collegeName', collegeName);

        if (selectedEmails.size > 0) {
            formData.append('selectedEmails', JSON.stringify(Array.from(selectedEmails)));
        }

        if (certTemplateFile) formData.append('certTemplate', certTemplateFile);
        if (uploadFile) formData.append('recipientFile', uploadFile);

        try {
            const res = await axios.post(`http://localhost:5000/api/events/${id}/email`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Success! Sent ${res.data.sent} emails.`);
            setSending(false);
        } catch (error) {
            console.error("Email send error:", error);
            alert("Failed to send emails. Check console.");
            setSending(false);
        }
    };

    // Treat all logged-in users as Owners/Admins
    const isOwner = !!user;

    // Auto-switch to registrations tab on load
    const hasRedirectedRef = React.useRef(false);
    useEffect(() => {
        if (isOwner && !hasRedirectedRef.current) {
            setActiveTab('create');
            hasRedirectedRef.current = true;
        }
    }, [isOwner]);

    // Force Login if not authenticated (and not loading)
    // Note: In real app, we might want a loading state for user fetch
    // useEffect(() => {
    //      if (!user) window.location.href = '/';
    // }, [user]);

    // Stats calculation
    const totalRegistrations = registrations.length;
    const sentCount = registrations.filter(r => r.status === 'Sent').length;

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRegistrations = React.useMemo(() => {
        let items = [...registrations];
        if (attendeeSearch) {
            items = items.filter(r =>
                (r.name || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                (r.email || '').toLowerCase().includes(attendeeSearch.toLowerCase())
            );
        }
        if (sortConfig) {
            items.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [registrations, attendeeSearch, sortConfig]);

    if (!event) return <div className="p-8">Loading event...</div>;


    return (
        <div className="min-h-screen bg-[#0a0b14] pb-12 relative overflow-hidden text-white">
            {/* Aurora Background Effects */}
            <div className="aurora-blur"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-brand-cyan/10 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-purple/10 rounded-full blur-[150px] animate-pulse"></div>

            {/* Header */}
            <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-xl shadow-lg shadow-brand-purple/20">
                            <LayoutDashboard size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter italic uppercase">{event.title}</h1>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{event.description || 'Event Management Console'}</p>
                        </div>
                    </div>
                    {user && (
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Admin</span>
                                <span className="text-sm font-bold">{user.displayName}</span>
                            </div>
                            <a href="http://localhost:5000/auth/logout" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-400/20 hover:bg-red-400/10 rounded-xl transition-all">
                                Terminate Session
                            </a>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10 relative z-10">
                {/* Tabs */}
                {isOwner && (
                    <div className="flex bg-white/5 p-1.5 rounded-2xl mb-12 border border-white/5 max-w-2xl mx-auto backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] tracking-widest ${activeTab === 'create' ? 'bg-white text-[#0a0b14] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Link size={14} /> CREATE HUB
                        </button>
                        <button
                            onClick={() => setActiveTab('registrations')}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] tracking-widest ${activeTab === 'registrations' ? 'bg-white text-[#0a0b14] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Users size={14} /> ATTENDEE MATRIX
                        </button>
                        <button
                            onClick={() => setActiveTab('automation')}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] tracking-widest ${activeTab === 'automation' ? 'bg-white text-[#0a0b14] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Workflow size={14} /> AUTOMATION
                        </button>
                        <button
                            onClick={() => setActiveTab('protocols')}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] tracking-widest ${activeTab === 'protocols' ? 'bg-white text-[#0a0b14] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Zap size={14} className="text-brand-purple" /> PROTOCOLS
                        </button>
                    </div>
                )}

                {/* TAB 1: REGISTRATION HUB */}
                {activeTab === 'create' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Configuration Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass p-10 rounded-[2.5rem] border-white/5">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                                    <div className="p-3 bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 text-brand-cyan rounded-2xl">
                                        <Settings size={28} />
                                    </div>
                                    Link Configuration
                                </h2>

                                <div className="space-y-10">
                                    {/* Quick Start Hub */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                                            <ShieldCheck size={14} className="text-brand-cyan" /> PROTOCOL: QUICK START
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <a
                                                href="https://forms.new"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all group"
                                            >
                                                <div className="p-3 bg-white/10 rounded-2xl text-green-400 group-hover:scale-110 transition shadow-lg">
                                                    <FileSpreadsheet size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-green-400 uppercase tracking-tight">Google Form</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">LAUNCH FORMS.NEW</p>
                                                </div>
                                            </a>
                                            <a
                                                href="https://tally.so/create"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all group"
                                            >
                                                <div className="p-3 bg-white/10 rounded-2xl text-blue-400 group-hover:scale-110 transition shadow-lg">
                                                    <LayoutDashboard size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-blue-400 uppercase tracking-tight">Tally Form</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">LAUNCH TALLY.SO</p>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Platform Selection */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                                            <Settings size={14} className="text-brand-purple" /> PROTOCOL: PLATFORM
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: 'google', name: 'Google Sheets', icon: FileSpreadsheet, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                                                { id: 'tally', name: 'Tally Forms', icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' }
                                            ].map((platform) => (
                                                <button
                                                    key={platform.id}
                                                    type="button"
                                                    onClick={() => setRegType(platform.id as 'google' | 'tally')}
                                                    className={`group relative flex flex-col items-center justify-center p-8 border-2 rounded-3xl transition-all duration-300 ${regType === platform.id ? platform.border + ' ' + platform.bg + ' shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'border-white/5 hover:border-white/10 bg-white/[0.02]'}`}
                                                >
                                                    <div className={`p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${regType === platform.id ? platform.color : 'text-gray-600'}`}>
                                                        <platform.icon size={40} />
                                                    </div>
                                                    <span className={`font-black text-xs uppercase tracking-widest ${regType === platform.id ? 'text-white' : 'text-gray-500'}`}>{platform.name}</span>
                                                    {regType === platform.id && <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* URL Input */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                                            <Link size={14} className="text-brand-cyan" /> PROTOCOL: DESTINATION
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <Link size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-brand-cyan outline-none transition-all placeholder:text-gray-700 font-bold"
                                                placeholder={`Paste ${regType === 'google' ? 'Google' : 'Tally'} Form URL...`}
                                                value={formUrl}
                                                onChange={e => setFormUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Sheet/Endpoint Input */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                                            {regType === 'google' ? <FileSpreadsheet size={14} className="text-green-400" /> : <Workflow size={14} className="text-brand-purple" />}
                                            PROTOCOL: {regType === 'google' ? 'SHEET SYNC' : 'API DATA'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                {regType === 'google' ? <FileSpreadsheet size={20} /> : <Workflow size={20} />}
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-brand-purple outline-none transition-all placeholder:text-gray-700 font-bold"
                                                placeholder={regType === 'google' ? "Sheet ID (from URL)" : "Form ID or Webhook URL"}
                                                value={regType === 'google' ? sheetId : tallyUrl}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (regType === 'google') {
                                                        const match = val.match(/\/d\/(.*?)(\/|$)/);
                                                        setSheetId(match ? match[1] : val);
                                                    } else {
                                                        setTallyUrl(val);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Settings Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">CAPACITY PROTOCOL</label>
                                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-brand-cyan transition-all">
                                                <Users2 size={20} className="text-gray-500" />
                                                <input
                                                    type="number"
                                                    placeholder="UNLIMITED"
                                                    className="bg-transparent border-none outline-none text-sm w-full font-bold text-white placeholder:text-gray-700"
                                                    value={regLimit}
                                                    onChange={e => setRegLimit(e.target.value ? Number(e.target.value) : '')}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TRANSMISSION STATUS</label>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accepting Responses</span>
                                                <button
                                                    onClick={() => setRegEnabled(!regEnabled)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${regEnabled ? 'bg-brand-cyan' : 'bg-white/10'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${regEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-lg`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button onClick={handleUpdate} className="bg-gradient-to-r from-brand-purple to-brand-cyan text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] active:scale-95 transition-all w-full flex items-center justify-center gap-2">
                                            <ShieldCheck size={20} />
                                            Synchronize Hub Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status/Share Column */}
                        <div className="space-y-6">
                            <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
                                <div className="bg-white/5 p-10 flex flex-col items-center border-b border-white/5">
                                    <div className="relative group mb-4">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-brand-purple to-brand-cyan rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                                        <div className="relative bg-white p-4 rounded-3xl shadow-2xl">
                                            <QRCodeSVG
                                                id="qr-svg"
                                                value={qrContent || formUrl || "https://eventrix.app"}
                                                size={180}
                                                fgColor={qrColor}
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-white font-black italic tracking-tighter text-2xl uppercase">QR Studio</h3>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em] mt-1">Real-time Encryptor</p>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Studio Tabs */}
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                        <button
                                            onClick={() => setQrActiveTab('content')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${qrActiveTab === 'content' ? 'bg-white text-[#0a0b14] shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            CONTENT
                                        </button>
                                        <button
                                            onClick={() => setQrActiveTab('style')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${qrActiveTab === 'style' ? 'bg-white text-[#0a0b14] shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            STYLE
                                        </button>
                                    </div>

                                    {qrActiveTab === 'content' ? (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Redirection Link</label>
                                            <textarea
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-brand-cyan outline-none h-24 resize-none font-bold text-white placeholder:text-gray-700 transition-all"
                                                value={qrContent}
                                                onChange={(e) => setQrContent(e.target.value)}
                                                placeholder="Paste any link to encode..."
                                            />
                                            <button
                                                onClick={() => setQrContent(formUrl)}
                                                className="text-[10px] font-black text-brand-cyan hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest ml-1"
                                            >
                                                <RefreshCw size={12} /> Sync with Main Form
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Branding Palette</label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {['#ffffff', '#7c3aed', '#06b6d4', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#000000'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setQrColor(color)}
                                                        className={`w-full aspect-square rounded-2xl border-2 transition-all hover:scale-110 shadow-lg ${qrColor === color ? 'border-white ring-4 ring-white/10' : 'border-white/5'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <input
                                                    type="color"
                                                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                                                    value={qrColor}
                                                    onChange={(e) => setQrColor(e.target.value)}
                                                />
                                                <span className="text-xs font-black text-white uppercase tracking-widest">{qrColor}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleDownloadQR}
                                            className="flex items-center justify-center gap-3 py-4 bg-brand-cyan/10 text-brand-cyan rounded-2xl font-black text-[10px] tracking-widest hover:bg-brand-cyan/20 transition-all border border-brand-cyan/20"
                                        >
                                            <Download size={14} /> EXPORT PNG
                                        </button>
                                        <button
                                            onClick={handleCopyLink}
                                            className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-[#0a0b14] hover:bg-white/90 shadow-xl'}`}
                                        >
                                            {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
                                            {copied ? 'COPIED' : 'COPY LINK'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity Meter Card */}
                            <div className="glass p-8 rounded-[2.5rem] border-white/5">
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">
                                    <span>Core Capacity Meter</span>
                                    <span className={registrations.length >= (regLimit || Infinity) ? 'text-red-400' : 'text-brand-cyan'}>
                                        {registrations.length} / {regLimit || '∞'}
                                    </span>
                                </div>
                                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.3)] ${registrations.length >= (regLimit || Infinity) ? 'bg-red-500 shadow-red-500/50' : 'bg-gradient-to-r from-brand-purple to-brand-cyan'}`}
                                        style={{ width: regLimit ? `${Math.min((registrations.length / regLimit) * 100, 100)}%` : '0%' }}
                                    />
                                </div>
                                {regLimit && registrations.length >= regLimit && (
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-4 text-center animate-pulse">
                                        <ShieldAlert size={12} className="inline mr-1" /> Critical Capacity Reached
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* TAB 3: ATTENDEE DATABASE */}
                {
                    activeTab === 'registrations' && (
                        <div className="glass rounded-[2.5rem] border-white/5 flex flex-col min-h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Matrix Header */}
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-cyan/10 text-brand-cyan rounded-2xl">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Attendee Matrix</h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Real-time participant database</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="SEARCH IDENTITY..."
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white placeholder:text-gray-700 focus:ring-2 focus:ring-brand-cyan outline-none transition-all"
                                            value={attendeeSearch}
                                            onChange={(e) => setAttendeeSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={fetchRegistrations}
                                            disabled={loadingRegs}
                                            className="p-3 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl transition-all hover:bg-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                            title="Sync from source"
                                        >
                                            <RefreshCw size={18} className={loadingRegs ? 'animate-spin' : ''} />
                                            Sync
                                        </button>
                                        <a
                                            href={`https://docs.google.com/spreadsheets/d/${event.googleSheetId}/edit`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-green-400 rounded-xl hover:bg-green-400/10 transition-all"
                                        >
                                            Source <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 sticky top-0 z-10">
                                        <tr>
                                            {['name', 'email', 'college', 'status'].map((key) => (
                                                <th
                                                    key={key}
                                                    onClick={() => handleSort(key)}
                                                    className="p-6 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] cursor-pointer hover:text-brand-cyan transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {key}
                                                        {sortConfig?.key === key ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 opacity-20" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loadingRegs ? (
                                            <tr>
                                                <td colSpan={4} className="p-24 text-center">
                                                    <RefreshCw size={48} className="mx-auto mb-6 animate-spin text-brand-cyan/50" />
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Synchronizing encrypted data...</p>
                                                </td>
                                            </tr>
                                        ) : sortedRegistrations.length > 0 ? (
                                            sortedRegistrations.map((r, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-6 text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{r.name}</td>
                                                    <td className="p-6 text-sm text-gray-400 font-medium">{r.email}</td>
                                                    <td className="p-6 text-sm text-gray-500 font-medium">{r.college || '-'}</td>
                                                    <td className="p-6">
                                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.status === 'Sent'
                                                            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                                            : 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
                                                            }`}>
                                                            {r.status === 'Sent' ? <CheckCircle2 size={12} /> : null}
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-24 text-center">
                                                    <div className="opacity-20 flex flex-col items-center">
                                                        {attendeeSearch ? (
                                                            <p className="text-sm font-bold uppercase tracking-widest text-white">No matching identity detected</p>
                                                        ) : (
                                                            <>
                                                                <FileSpreadsheet size={64} className="mb-6 text-white" />
                                                                <p className="text-sm font-bold uppercase tracking-widest text-white">Database entry not found</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white/[0.02] border-t border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex justify-between">
                                <span>Manifesting {sortedRegistrations.length} of {registrations.length} units</span>
                                <span>Protocol Echo: {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    )
                }

                {/* TAB 4: AUTOMATION */}
                {activeTab === 'automation' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass p-10 rounded-[2.5rem] border-white/5">
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                                <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
                                    <Workflow size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Autosender</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Automated Transmissions Protocol</p>
                                </div>
                            </div>

                            {/* Delivery Stats Report */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-brand-cyan/20 transition-all group">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-brand-cyan transition-colors">Total Participants</p>
                                    <p className="text-3xl font-black text-white mt-1 tracking-tighter italic">{totalRegistrations}</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-green-400/20 transition-all group">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-green-400 transition-colors">Certificates Sent</p>
                                    <p className="text-3xl font-black text-white mt-1 tracking-tighter italic">
                                        {sentCount} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">/ {totalRegistrations}</span>
                                    </p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-brand-purple/20 transition-all group">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-brand-purple transition-colors">Success Rate</p>
                                    <p className="text-3xl font-black text-white mt-1 tracking-tighter italic">
                                        {totalRegistrations > 0 ? Math.round((sentCount / totalRegistrations) * 100) : 0}%
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-10">
                                {/* Configuration & Preview Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Configuration */}
                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-1">TRANSMISSION TYPE</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setEmailType('certificate')}
                                                    className={`flex items-center justify-center gap-3 p-4 border-2 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all ${emailType === 'certificate' ? 'border-brand-purple bg-brand-purple/10 text-brand-purple shadow-[0_0_20px_rgba(124,58,237,0.15)]' : 'border-white/5 hover:border-white/10 text-gray-500 bg-white/[0.02]'}`}
                                                >
                                                    <Settings size={18} /> TYPE: CERTIFICATE
                                                </button>
                                                <button
                                                    onClick={() => setEmailType('update')}
                                                    className={`flex items-center justify-center gap-3 p-4 border-2 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all ${emailType === 'update' ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-white/5 hover:border-white/10 text-gray-500 bg-white/[0.02]'}`}
                                                >
                                                    <Download size={18} /> TYPE: UPDATE
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-1">RECIPIENT SOURCE</label>
                                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-6">
                                                <button
                                                    onClick={() => setRecipientSource('live')}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'live' ? 'bg-white text-[#0a0b14] shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    LIVE DB ({registrations.length})
                                                </button>
                                                <button
                                                    onClick={() => setRecipientSource('upload')}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'upload' ? 'bg-white text-[#0a0b14] shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    UPLOAD PROTOCOL
                                                </button>
                                            </div>

                                            {recipientSource === 'live' && (
                                                <div className="mb-6 ml-1">
                                                    <button
                                                        onClick={() => setShowRecipientModal(true)}
                                                        className="text-[10px] flex items-center gap-2 text-brand-cyan hover:text-white font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        <Users size={16} />
                                                        {selectedEmails.size > 0 ? `${selectedEmails.size} UNITS SELECTED` : 'CALIBRATE RECIPIENTS'}
                                                    </button>
                                                </div>
                                            )}

                                            {recipientSource === 'upload' && (
                                                <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center hover:bg-white/[0.03] transition-all cursor-pointer relative group">
                                                    <input
                                                        type="file"
                                                        accept=".csv,.xlsx,.xls"
                                                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-white/5 text-gray-400 rounded-2xl group-hover:scale-110 group-hover:text-brand-cyan transition-all duration-500">
                                                            <FileSpreadsheet size={32} />
                                                        </div>
                                                        {uploadFile ? (
                                                            <div>
                                                                <p className="font-bold text-white uppercase tracking-tight">{uploadFile.name}</p>
                                                                <p className="text-[10px] text-gray-500 font-black uppercase mt-1">{(uploadFile.size / 1024).toFixed(1)} KB DETECTED</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className="font-black text-white uppercase tracking-widest">DRAG CSV/EXCEL</p>
                                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">DATA INGESTION PROTOCOL</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-1">TRANSMISSION SUBJECT</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-purple outline-none transition-all placeholder:text-gray-700"
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                    placeholder="Enter transmission subject..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-1">COLLEGE / ORG IDENTITY</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-cyan outline-none transition-all placeholder:text-gray-700 font-bold"
                                                    value={collegeName}
                                                    onChange={(e) => setCollegeName(e.target.value)}
                                                    placeholder="Enter college name..."
                                                />
                                            </div>
                                        </div>



                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-1">CONTENT TEMPLATE</label>
                                            <div className="relative group">
                                                <SimpleRichEditor
                                                    value={message}
                                                    onChange={setMessage}
                                                    placeholder="Initialize transmission content..."
                                                    className="min-h-[200px] bg-white/5 border-white/10 rounded-3xl text-white font-medium"
                                                />
                                                <div className="absolute top-4 right-4 text-[9px] font-black text-brand-cyan bg-[#0a0b14]/80 px-3 py-1.5 rounded-full border border-brand-cyan/20 z-10 uppercase tracking-widest backdrop-blur-md">
                                                    ID: {'{{Name}}'} / {'{{Event}}'} / {'{{College}}'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleSendEmail}
                                                disabled={(recipientSource === 'upload' && !uploadFile) || sending}
                                                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 ${(recipientSource === 'upload' && !uploadFile) || sending
                                                    ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                                    : 'bg-gradient-to-r from-brand-purple to-brand-cyan text-white hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(124,58,237,0.3)] active:scale-95'
                                                    }`}
                                            >
                                                <Workflow size={20} />
                                                {sending ? 'INITIALIZING TRANSMISSION...' : (recipientSource === 'live'
                                                    ? (selectedEmails.size > 0 ? `EXECUTE: ${selectedEmails.size} TARGETS` : `EXECUTE: GLOBAL BROADCAST`)
                                                    : `EXECUTE: FILE BROADCAST`
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="space-y-6">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">LIVE TRANSMISSION PREVIEW</label>
                                        <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl sticky top-28">
                                            <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                                </div>
                                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Encrypted Viewport</div>
                                            </div>
                                            <div className="p-8 space-y-6">
                                                <div className="border-b border-white/5 pb-6 space-y-3">
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-gray-600 w-12 text-right font-black uppercase tracking-widest">TO:</span>
                                                        <span className="text-brand-cyan font-bold tracking-tight">target.identity@protocol.io</span>
                                                    </div>
                                                    <div className="flex gap-4 text-xs font-bold">
                                                        <span className="text-gray-600 w-12 text-right uppercase tracking-widest">SUB:</span>
                                                        <span className="text-white tracking-tight">{subject || 'Participation Credentials Received'}</span>
                                                    </div>
                                                </div>

                                                <div className="prose prose-invert prose-sm max-w-none text-gray-400 font-medium leading-relaxed">
                                                    <p className="text-white font-bold">Inbound Transmission Initialized...</p>
                                                    <div
                                                        className="mt-4"
                                                        dangerouslySetInnerHTML={{
                                                            __html: message
                                                                .replace(/\{\{Name\}\}/g, '<strong>IDENT-ALPHA</strong>')
                                                                .replace(/\{\{Event\}\}/g, `<strong>${event.title}</strong>`)
                                                                .replace(/\{\{College\}\}/g, `<strong>${collegeName || 'COLL-ORBIT'}</strong>`)
                                                        }}
                                                    />
                                                </div>

                                                {emailType === 'certificate' && (
                                                    <div className="mt-6 flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-brand-purple/20 transition-all">
                                                        <div className="p-2.5 bg-brand-purple/10 text-brand-purple rounded-xl group-hover:scale-110 transition-transform">
                                                            <FileSpreadsheet size={24} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-xs font-bold text-white uppercase tracking-tight truncate">Credentials-Report.pdf</p>
                                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">1.2 MB Encrypted</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width Certificate Editor - Moved outside the grid for space */}
                                {emailType === 'certificate' && (
                                    <div className="border-t border-white/5 pt-10">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 ml-1 text-center">VISUAL IDENTITY PROTOCOL (CERTIFICATE LAYOUT)</label>
                                        {!certTemplateFile ? (
                                            <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 text-center hover:bg-white/5 transition-all relative bg-white/[0.02] flex flex-col items-center justify-center gap-8 group">
                                                <div className="relative cursor-pointer w-full">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setCertTemplateFile(e.target.files ? e.target.files[0] : null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-5 bg-white/5 text-gray-400 rounded-3xl group-hover:scale-110 group-hover:text-brand-purple transition-all duration-500">
                                                            <FileSpreadsheet size={40} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white uppercase tracking-widest">Upload Template</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">PNG/JPG PROTOCOL</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 w-full max-w-xs">
                                                    <div className="h-px bg-white/5 flex-1"></div>
                                                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">OR</span>
                                                    <div className="h-px bg-white/5 flex-1"></div>
                                                </div>

                                                <button
                                                    onClick={() => setShowGallery(true)}
                                                    className="flex items-center gap-3 bg-white text-[#0a0b14] px-8 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-xl z-20"
                                                >
                                                    <LayoutTemplate size={18} /> OPEN GALLERY
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center p-5 bg-brand-purple/10 border border-brand-purple/20 rounded-3xl max-w-2xl mx-auto">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-brand-purple/20 text-brand-purple rounded-xl">
                                                            <FileSpreadsheet size={20} />
                                                        </div>
                                                        <span className="text-sm font-bold text-white uppercase tracking-tight">{certTemplateFile.name}</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setShowGallery(true)}
                                                            className="text-brand-cyan hover:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl hover:bg-brand-cyan/10 transition-all border border-brand-cyan/20"
                                                        >
                                                            CHANGE
                                                        </button>
                                                        <button
                                                            onClick={() => setCertTemplateFile(null)}
                                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <CertificateEditor
                                                    templateUrl={certTemplateFile ? URL.createObjectURL(certTemplateFile) : ""}
                                                    initialLayout={certLayout}
                                                    onSave={handleSaveLayout}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gallery Modal - Rendered outside the grid but potentially inside activeTab check or main */}
                {showGallery && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">Certificate Gallery</h3>
                                    <p className="text-gray-500">Select templates to use instantly</p>
                                </div>
                                <button
                                    onClick={() => setShowGallery(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <X size={24} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                                {templates.map((t) => (
                                    <div
                                        key={t.url}
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(t.url);
                                                const blob = await response.blob();
                                                const filename = t.url.split('/').pop() || "template.png";
                                                const file = new File([blob], filename, { type: "image/png" });
                                                setCertTemplateFile(file);
                                                setShowGallery(false);
                                            } catch (err) {
                                                console.error("Failed to load template", err);
                                                alert("Failed to load template from gallery");
                                            }
                                        }}
                                        className="group cursor-pointer border rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:ring-2 hover:ring-blue-500 transition-all duration-300 relative"
                                    >
                                        <div className="aspect-[1.414/1] bg-gray-200 relative overflow-hidden">
                                            <img
                                                src={t.url}
                                                alt={t.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <div className="p-3 bg-white">
                                            <h4 className="font-semibold text-gray-800">{t.name}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t text-right">
                                <button
                                    onClick={() => setShowGallery(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recipient Selection Modal */}
                {showRecipientModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Select Recipients</h3>
                                <button onClick={() => setShowRecipientModal(false)}><X size={24} className="text-gray-500 hover:text-gray-700" /></button>
                            </div>

                            <div className="mb-4 relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by Name or Email..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 border-b w-10">
                                                <button
                                                    onClick={() => handleSelectAll(registrations.filter(r =>
                                                        (r.Name || r.name || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                        (r.Email || r.email || '').toLowerCase().includes(recipientSearch.toLowerCase())
                                                    ))}
                                                    className="text-gray-500 hover:text-blue-600"
                                                >
                                                    <CheckSquare size={18} />
                                                </button>
                                            </th>
                                            <th className="p-3 border-b text-xs font-bold text-gray-500 uppercase">Name</th>
                                            <th className="p-3 border-b text-xs font-bold text-gray-500 uppercase">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {registrations
                                            .filter(r =>
                                                (r.Name || r.name || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                (r.Email || r.email || '').toLowerCase().includes(recipientSearch.toLowerCase())
                                            )
                                            .map((r, i) => {
                                                const email = r.Email || r.email;
                                                const name = r.Name || r.name;
                                                const isSelected = selectedEmails.has(email);
                                                return (
                                                    <tr key={i} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <td className="p-3">
                                                            <button onClick={() => handleToggleSelect(email)} className={isSelected ? 'text-blue-600' : 'text-gray-400'}>
                                                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                            </button>
                                                        </td>
                                                        <td className="p-3 text-sm font-medium text-gray-900">{name}</td>
                                                        <td className="p-3 text-sm text-gray-500">{email}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-sm text-gray-500">{selectedEmails.size} Selected</span>
                                <button
                                    onClick={() => setShowRecipientModal(false)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: PROTOCOLS */}
                {activeTab === 'protocols' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Protocol AURORA Card */}
                        <div className="bg-[#0f111a] border border-brand-purple/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-purple/10 transition-all"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-brand-purple/20 text-brand-purple rounded-2xl">
                                        <Zap size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Protocol AURORA</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Pulse Display</p>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                    Launch a cinematic, high-energy live dashboard designed for fullscreen projection. Displays real-time registration pulses and arrival announcements with premium Aurora animations.
                                </p>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-purple bg-brand-purple/5 px-6 py-3 rounded-xl border border-brand-purple/10">
                                        <MonitorPlay size={16} /> Projection Ready (1080p/4K)
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-cyan bg-brand-cyan/5 px-6 py-3 rounded-xl border border-brand-cyan/10">
                                        <RefreshCw size={16} className="animate-spin" /> Autoscale Enabled
                                    </div>
                                </div>

                                <a
                                    href={`/live/${id}`}
                                    target="_blank"
                                    className="w-full flex items-center justify-center gap-3 bg-brand-purple text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-purple/20"
                                >
                                    INHERIT PULSE STREAM
                                </a>
                            </div>
                        </div>

                        {/* Protocol LINK Card */}
                        <div className="bg-[#0f111a] border border-brand-cyan/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-cyan/10 transition-all"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-brand-cyan/20 text-brand-cyan rounded-2xl">
                                        <ExternalLink size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Protocol LINK</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verification Hub</p>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                    The Verification Hub transforms certificates into authenticated digital credentials. Each QR code points to a public landing page with LinkedIn social integration for participants.
                                </p>

                                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] mb-10">
                                    <span className="text-[9px] font-black text-brand-cyan uppercase tracking-widest block mb-1">Status Report</span>
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <CheckCircle2 size={16} className="text-brand-cyan" />
                                        SHA-256 Hashing Active
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                        <p className="text-[20px] font-black italic text-white mb-1">∞</p>
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Verified Assets</p>
                                    </div>
                                    <div className="flex-1 p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                        <p className="text-[20px] font-black italic text-white mb-1">Enabled</p>
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Social Sync</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Info */}
                <div className="mt-12 pt-4 border-t text-sm text-gray-400">
                    <p>Logged in as: {user ? `${user.displayName} (ID: ${user.id})` : 'Guest'}</p>
                    {!user && <a href="/" className="text-blue-500 underline ml-2">Go to Login</a>}
                </div>
            </main>
        </div>
    );
};

export default EventDashboard;
