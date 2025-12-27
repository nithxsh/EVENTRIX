import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Users, Trophy, School, Activity } from 'lucide-react';
import { API_URL } from '../config';


interface LivePulseData {
    title: string;
    college: string;
    totalRegistrations: number;
    recent: Array<{
        name: string;
        college: string;
        timestamp: string;
    }>;
}

const LiveDisplay: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<LivePulseData | null>(null);
    const [prevCount, setPrevCount] = useState(0);
    const [newAttendee, setNewAttendee] = useState<string | null>(null);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/events/${id}/pulse`);
                const pulseData: LivePulseData = res.data;

                if (pulseData.totalRegistrations > prevCount && prevCount !== 0) {
                    const latest = pulseData.recent[0]?.name;
                    setNewAttendee(latest);
                    setTimeout(() => setNewAttendee(null), 5000);
                }

                setData(pulseData);
                setPrevCount(pulseData.totalRegistrations);
            } catch (err) {
                console.error("Pulse fetch failed:", err);
            }
        };

        fetchPulse();
        const interval = setInterval(fetchPulse, 3000); // 3-second heartbeat
        return () => clearInterval(interval);
    }, [id, prevCount]);

    return (
        <div className="min-h-screen bg-[#020205] text-white flex flex-col overflow-hidden relative font-sans selection:bg-brand-purple/30">
            {/* Ambient Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-purple/10 rounded-full blur-[200px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-cyan/10 rounded-full blur-[200px] animate-pulse duration-7000"></div>
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            {/* Header Section */}
            <header className="relative z-10 p-12 flex justify-between items-start">
                <div className="animate-in fade-in slide-in-from-left duration-1000">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-brand-purple/20 border border-brand-purple/30 rounded-xl">
                            <Activity size={24} className="text-brand-purple animate-pulse" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.5em] text-brand-purple">Live Event Stream</span>
                    </div>
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase mb-2 bg-gradient-to-r from-white via-white to-gray-600 bg-clip-text text-transparent">
                        {data?.title || 'Protocol Event'}
                    </h1>
                    <div className="flex items-center gap-2 opacity-60">
                        <School size={16} className="text-brand-cyan" />
                        <p className="text-xs font-bold uppercase tracking-widest">{data?.college || 'Global Hub'}</p>
                    </div>
                </div>

                <div className="flex gap-12 text-right animate-in fade-in slide-in-from-right duration-1000">
                    <div className="py-2 border-r border-white/10 px-12">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact Factor</p>
                        <div className="text-6xl font-black italic tracking-tighter text-brand-cyan tabular-nums">
                            {data?.totalRegistrations || 0}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center justify-end gap-2 text-green-400 font-bold uppercase tracking-widest text-xs">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                            Receiving Packets
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Display Area */}
            <main className="flex-1 relative z-10 p-12 flex items-center justify-center">
                {newAttendee && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-50 animate-in zoom-in spin-in-2 duration-700">
                        <div className="bg-brand-purple/20 backdrop-blur-3xl border-2 border-brand-purple/50 p-16 rounded-[4rem] inline-block shadow-[0_0_100px_rgba(124,58,237,0.3)]">
                            <p className="text-xl font-black text-brand-purple uppercase tracking-[1em] mb-4">New Arrival</p>
                            <h2 className="text-9xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                                {newAttendee}
                            </h2>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl">
                    {data?.recent.map((attendee, idx) => (
                        <div
                            key={idx}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500 group animate-in fade-in slide-in-from-bottom duration-700"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-brand-purple/50 group-hover:bg-brand-purple/10 transition-colors">
                                <Users size={20} className="text-gray-400 group-hover:text-brand-purple transition-colors" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-brand-cyan transition-colors">
                                {attendee.name}
                            </h3>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                {attendee.college || 'Verified Participant'}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer Display */}
            <footer className="relative z-10 p-12 bg-black/40 backdrop-blur-lg border-t border-white/5">
                <div className="flex justify-between items-center opacity-40 uppercase font-black text-[9px] tracking-[0.6em]">
                    <div className="flex gap-12">
                        <span>Terminal: {id?.slice(0, 8)}</span>
                        <span>Protocol: Aurora Live Pulse</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Trophy size={14} className="text-brand-purple" />
                        <span>Eventrix Visualization Engine</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LiveDisplay;
