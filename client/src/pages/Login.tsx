import React, { useState } from 'react';
import axios from 'axios';
import { Smartphone, Mail } from 'lucide-react';

const Login: React.FC = () => {
    const [tab, setTab] = useState<'google' | 'mobile'>('google');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'input' | 'verify'>('input');
    const [loading, setLoading] = useState(false);

    // Explicitly define the base URL for frontend API calls
    const API_URL = 'http://localhost:5000';



    const handleSendOTP = async () => {
        if (!mobile || mobile.length < 10) return alert("Please enter a valid mobile number");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/otp/send`, { mobile });
            setStep('verify');
            alert(`OTP sent to ${mobile}. (Check Server Console)`);
        } catch (err) {
            console.error(err);
            alert("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) return alert("Please enter OTP");
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/otp/verify`, { mobile, code: otp }, { withCredentials: true });
            if (res.data.user) {
                // Redirect to dashboard (hardcoded ID 1 for MVP)
                window.location.href = '/dashboard/1';
            }
        } catch (err) {
            console.error(err);
            alert("Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Aurora Background Effects */}
            <div className="aurora-blur"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-cyan/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-purple/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="glass p-10 rounded-[2.5rem] w-full max-w-md relative z-10">
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-black tracking-tighter italic bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent mb-2">
                        EVENTRIX
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Command Center Login</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
                    <button
                        onClick={() => setTab('google')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${tab === 'google' ? 'bg-white text-[#0a0b14] shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Mail size={16} /> GOOGLE
                    </button>
                    <button
                        onClick={() => setTab('mobile')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${tab === 'mobile' ? 'bg-white text-[#0a0b14] shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Smartphone size={16} /> MOBILE
                    </button>
                </div>

                {tab === 'google' ? (
                    <div className="space-y-6">
                        <a
                            href={`${API_URL}/auth/google`}
                            className="group relative w-full flex items-center justify-center gap-4 bg-white text-[#0a0b14] font-black py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            ENTER WITH GOOGLE
                        </a>
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/10"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Authorized Access only</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {step === 'input' ? (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Identity</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="tel"
                                            placeholder="9876543210"
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-brand-cyan outline-none transition-all placeholder:text-gray-600 font-bold"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-brand-cyan to-blue-600 text-white font-black py-4 rounded-2xl hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'INITIALIZING...' : 'TRANSMIT OTP'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3 text-center">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Protocol</label>
                                    <input
                                        type="text"
                                        placeholder="0 0 0 0 0 0"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white focus:ring-2 focus:ring-brand-purple outline-none text-center tracking-[0.5em] text-2xl font-black transition-all"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                    <p className="text-[10px] text-brand-cyan font-bold animate-pulse uppercase">Code intercepted in console</p>
                                </div>
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-brand-purple to-pink-600 text-white font-black py-4 rounded-2xl hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all active:scale-95"
                                >
                                    {loading ? 'VERIFYING...' : 'DECRYPT & ENTER'}
                                </button>
                                <button
                                    onClick={() => setStep('input')}
                                    className="w-full text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Abort & Change Identity
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="fixed bottom-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                Eventrix Enterprise OS v2.0
            </p>
        </div>
    );
};

export default Login;
