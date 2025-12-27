import React from 'react';
import { API_URL } from '../config';

const Login: React.FC = () => {
    // No state needed for just a link


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
            </div>

            <p className="fixed bottom-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                Eventrix Enterprise OS v2.0
            </p>
        </div>
    );
};

export default Login;
