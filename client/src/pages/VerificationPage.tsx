import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Linkedin, Download, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';


interface VerificationData {
    name: string;
    email: string;
    eventName: string;
    college: string;
    verifiedAt: string;
}

const VerificationPage: React.FC = () => {
    const { hash } = useParams<{ hash: string }>();
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/events/verify/${hash}`);
                setData(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Verification failed:", err);
                setError(true);
                setLoading(false);
            }
        };
        verify();
    }, [hash]);

    const handleLinkedInShare = () => {
        if (!data) return;
        const url = window.location.href;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#05060b] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#05060b] flex flex-col items-center justify-center p-6">
                <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-[2.5rem] text-center max-w-md backdrop-blur-xl">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Protocol Invalid</h2>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                        The verification hash provided does not match any authenticated record in the Eventrix Central Hub.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05060b] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Aurora Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/20 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-cyan/20 rounded-full blur-[150px] animate-pulse duration-5000"></div>

            <div className="relative z-10 w-full max-w-2xl">
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl">
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 px-6 py-2 rounded-full mb-10 animate-bounce">
                            <CheckCircle size={18} className="text-brand-cyan" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan">Verified Credential</span>
                        </div>

                        <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            {data?.name}
                        </h1>
                        <p className="text-brand-purple font-black uppercase tracking-[0.4em] text-xs mb-12">Certified Participant</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">EVENT IDENTITY</span>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{data?.eventName}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">ISSUED BY</span>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{data?.college || 'Eventrix Hub'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button
                                onClick={handleLinkedInShare}
                                className="flex items-center justify-center gap-3 bg-[#0077b5] text-white px-10 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all font-black text-[12px] uppercase tracking-widest shadow-xl shadow-[#0077b5]/20"
                            >
                                <Linkedin size={20} /> Share Achievement
                            </button>
                            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl hover:bg-white/10 transition-all font-black text-[12px] uppercase tracking-widest">
                                <Download size={20} /> Export Evidence
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border-t border-white/5 p-8 text-center">
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.5em] mb-2">Protocol: SHA-256 Verification Hub</p>
                        <p className="text-[8px] text-gray-500 font-black uppercase">Verified at: {new Date(data?.verifiedAt || '').toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Powered by Eventrix Midnight Aurora Engine</p>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
