import React, { useState, useRef } from 'react';
import { Save, AlignLeft, AlignCenter, Plus, Trash2, Scaling, QrCode } from 'lucide-react';

interface Coordinate {
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color: string;
    align: 'left' | 'center';
}

interface CertificateImage {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string; // Base64
}

interface QRCoordinate {
    x: number;
    y: number;
    width: number;
}

interface CertificateLayout {
    name?: Coordinate | null;
    event?: Coordinate | null;
    date?: Coordinate | null;
    college?: Coordinate | null;
    qr?: QRCoordinate | null;
    images: CertificateImage[];
}

interface CertificateEditorProps {
    templateUrl: string;
    initialLayout?: CertificateLayout;
    onSave: (layout: CertificateLayout) => void;
}

export const CertificateEditor: React.FC<CertificateEditorProps> = ({ templateUrl, initialLayout, onSave }) => {
    const defaultLayout: CertificateLayout = {
        name: { x: 0, y: 300, fontSize: 30, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        event: { x: 0, y: 400, fontSize: 20, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        date: { x: 0, y: 500, fontSize: 15, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        college: { x: 0, y: 100, fontSize: 18, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        qr: { x: 700, y: 450, width: 80 },
        images: []
    };

    const [layout, setLayout] = useState<CertificateLayout>(() => {
        if (!initialLayout) return defaultLayout;
        return {
            ...defaultLayout,
            ...initialLayout,
            images: initialLayout.images || [],
            college: initialLayout.college !== undefined ? initialLayout.college : defaultLayout.college,
            qr: initialLayout.qr !== undefined ? initialLayout.qr : defaultLayout.qr,
            date: initialLayout.date !== undefined ? initialLayout.date : defaultLayout.date,
            name: initialLayout.name !== undefined ? initialLayout.name : defaultLayout.name,
            event: initialLayout.event !== undefined ? initialLayout.event : defaultLayout.event
        };
    });

    const [showResourceMenu, setShowResourceMenu] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<string | null>(null);
    const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);
    const dragOffset = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateStyle = (key: keyof CertificateLayout, property: string, value: any) => {
        if (key === 'images') return;
        setLayout(prev => {
            const currentItem = prev[key] as any;
            if (!currentItem) return prev;
            return {
                ...prev,
                [key]: {
                    ...currentItem,
                    [property]: value
                }
            };
        });
    };

    const toggleAlign = (key: keyof CertificateLayout) => {
        if (key === 'images' || key === 'qr') return;
        setLayout(prev => {
            const item = prev[key] as Coordinate;
            if (!item) return prev;
            const newAlign = item.align === 'center' ? 'left' : 'center';

            return {
                ...prev,
                [key]: {
                    ...item,
                    align: newAlign,
                    x: newAlign === 'center' ? 0 : 300
                }
            };
        });
    };

    const removeModule = (key: keyof CertificateLayout) => {
        if (key === 'images') return;
        setLayout(prev => ({ ...prev, [key]: null }));
    };

    const restoreModule = (key: keyof CertificateLayout) => {
        if (key === 'images') return;
        setLayout(prev => ({ ...prev, [key]: defaultLayout[key] }));
        setShowResourceMenu(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            const newImage: CertificateImage = {
                id: `img_${Date.now()}`,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
                src
            };

            setLayout(prev => ({
                ...prev,
                images: [...prev.images, newImage]
            }));
            setShowResourceMenu(false);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = (id: string) => {
        setLayout(prev => ({
            ...prev,
            images: prev.images.filter(img => img.id !== id)
        }));
    };

    const handleGlobalMouseMove = (e: React.MouseEvent) => {
        if ((!draggingRef.current && !resizingRef.current) || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (resizingRef.current) {
            const { id, startX, startWidth } = resizingRef.current;
            const deltaX = clientX - startX;

            if (id === 'qr') {
                const newWidth = Math.max(30, startWidth + deltaX);
                setLayout(prev => ({
                    ...prev,
                    qr: { ...prev.qr!, width: newWidth }
                }));
            } else if (id.startsWith('img_')) {
                const newWidth = Math.max(30, startWidth + deltaX);
                setLayout(prev => ({
                    ...prev,
                    images: prev.images.map(img => img.id === id ? { ...img, width: newWidth } : img)
                }));
            } else {
                // Text elements: startWidth is repurposed as startFontSize
                const newSize = Math.max(8, startWidth + (deltaX / 10)); // Divide by 10 for smoother scaling
                setLayout(prev => {
                    const k = id as keyof CertificateLayout;
                    if (k === 'images') return prev;
                    return {
                        ...prev,
                        [k]: { ...prev[k]!, fontSize: Math.round(newSize) }
                    };
                });
            }
            return;
        }

        const key = draggingRef.current;
        if (!key) return;

        if (key === 'qr') {
            if (!layout.qr) return;
            const relX = clientX - containerRect.left;
            const relY = clientY - containerRect.top;
            setLayout(prev => ({
                ...prev,
                qr: {
                    ...prev.qr!,
                    x: relX - dragOffset.current.x,
                    y: relY - dragOffset.current.y
                }
            }));
            return;
        }

        if (key.startsWith('img_')) {
            const relX = clientX - containerRect.left;
            const relY = clientY - containerRect.top;

            setLayout(prev => ({
                ...prev,
                images: prev.images.map(img => img.id === key ? {
                    ...img,
                    x: relX - dragOffset.current.x,
                    y: relY - dragOffset.current.y
                } : img)
            }));
            return;
        }

        const k = key as keyof CertificateLayout;
        const item = layout[k] as Coordinate;
        if (!item) return;

        if (item.align === 'center') {
            const relY = clientY - containerRect.top;
            setLayout(prev => ({
                ...prev,
                [k]: {
                    ...prev[k] as Coordinate,
                    y: relY - dragOffset.current.y
                }
            }));
        } else {
            const relX = clientX - containerRect.left;
            const relY = clientY - containerRect.top;
            setLayout(prev => ({
                ...prev,
                [k]: {
                    ...prev[k] as Coordinate,
                    x: relX - dragOffset.current.x,
                    y: relY - dragOffset.current.y
                }
            }));
        }
    };

    const handleGlobalMouseUp = () => {
        draggingRef.current = null;
        resizingRef.current = null;
    };

    const handleResizeMouseDown = (e: React.MouseEvent, id: string, startVal: number) => {
        e.stopPropagation();
        e.preventDefault();
        resizingRef.current = {
            id,
            startX: e.clientX,
            startWidth: startVal // For text elements, this is the startFontSize
        };
    };

    const onMouseDown = (e: React.MouseEvent, key: string) => {
        e.stopPropagation();
        e.preventDefault();
        draggingRef.current = key;

        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            let itemX = 0;
            let itemY = 0;

            if (key === 'qr') {
                if (!layout.qr) return;
                itemX = layout.qr.x;
                itemY = layout.qr.y;
            } else if (key.startsWith('img_')) {
                const img = layout.images.find(i => i.id === key);
                if (img) {
                    itemX = img.x;
                    itemY = img.y;
                }
            } else {
                const k = key as keyof CertificateLayout;
                const item = layout[k] as Coordinate;
                if (!item) return;
                itemX = item.align === 'center' ? 0 : item.x;
                itemY = item.y;
            }

            const itemScreenX = containerRect.left + itemX;
            const itemScreenY = containerRect.top + itemY;

            dragOffset.current = {
                x: e.clientX - itemScreenX,
                y: e.clientY - itemScreenY
            };
        }
    };

    return (
        <div
            className="bg-[#0a0b14] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
            onMouseMove={handleGlobalMouseMove}
            onMouseUp={handleGlobalMouseUp}
            onMouseLeave={handleGlobalMouseUp}
        >
            {/* Background Blurs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="mb-10 flex flex-col gap-8 relative z-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-2">Visual Layout Editor</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] ml-1">Calibration of verification and branding protocols</p>
                    </div>
                    <div className="flex gap-4 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowResourceMenu(!showResourceMenu)}
                                className="flex items-center gap-3 bg-white/5 border border-white/10 text-brand-purple px-6 py-3 rounded-2xl hover:bg-brand-purple/10 hover:border-brand-purple/20 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <Plus size={18} /> {showResourceMenu ? 'CLOSE MENU' : 'ADD RESOURCE'}
                            </button>

                            {showResourceMenu && (
                                <div className="absolute top-full mt-3 right-0 w-64 bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">Identity Modules</h4>
                                    <div className="space-y-2">
                                        {!layout.name && (
                                            <button onClick={() => restoreModule('name')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between group">
                                                NAME IDENTITY <Plus size={14} className="text-brand-purple group-hover:scale-125 transition-transform" />
                                            </button>
                                        )}
                                        {!layout.event && (
                                            <button onClick={() => restoreModule('event')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between group">
                                                EVENT IDENTITY <Plus size={14} className="text-brand-purple group-hover:scale-125 transition-transform" />
                                            </button>
                                        )}
                                        {!layout.college && (
                                            <button onClick={() => restoreModule('college')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between group">
                                                COLLEGE IDENTITY <Plus size={14} className="text-brand-purple group-hover:scale-125 transition-transform" />
                                            </button>
                                        )}
                                        {!layout.date && (
                                            <button onClick={() => restoreModule('date')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between group">
                                                DATE IDENTITY <Plus size={14} className="text-brand-purple group-hover:scale-125 transition-transform" />
                                            </button>
                                        )}
                                        {!layout.qr && (
                                            <button onClick={() => restoreModule('qr')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between group border-t border-white/5 mt-2 pt-4">
                                                VERIFICATION QR <QrCode size={14} className="text-brand-cyan group-hover:scale-125 transition-transform" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between mt-2 border border-brand-purple/20 bg-brand-purple/5"
                                        >
                                            UPLOAD IMAGE <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => onSave(layout)}
                            className="flex items-center gap-3 bg-gradient-to-r from-brand-purple to-brand-cyan text-white px-8 py-3 rounded-2xl hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-purple/20"
                        >
                            <Save size={18} /> SYNC PROTOCOL
                        </button>
                    </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 backdrop-blur-md min-h-[160px]">
                    {['name', 'event', 'college', 'date'].map(key => {
                        const k = key as keyof CertificateLayout;
                        const item = layout[k] as Coordinate;
                        if (!item) return null;

                        return (
                            <div key={k} className="flex flex-col gap-4 p-5 border border-white/5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative group">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="capitalize font-black text-[10px] text-gray-400 tracking-[0.2em]">{k} IDENTITY</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleAlign(k)}
                                            className={`p-2 rounded-xl transition-all ${item.align === 'center' ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'hover:bg-white/10 text-gray-600'}`}
                                            title="Toggle Alignment"
                                        >
                                            {item.align === 'center' ? <AlignCenter size={16} /> : <AlignLeft size={16} />}
                                        </button>
                                        <button
                                            onClick={() => removeModule(k)}
                                            className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                            title="Remove Module"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-1.5 ml-1">SIZE</label>
                                            <input
                                                type="number"
                                                value={item.fontSize}
                                                onChange={(e) => updateStyle(k, 'fontSize', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white font-bold focus:ring-1 focus:ring-brand-purple outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-1.5 ml-1">COLOR</label>
                                            <div className="relative group/color">
                                                <input
                                                    type="color"
                                                    value={item.color}
                                                    onChange={(e) => updateStyle(k, 'color', e.target.value)}
                                                    className="w-full h-8 border border-white/10 rounded-xl bg-white/5 cursor-pointer p-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-2 ml-1">FONT PROTOCOL</label>
                                        <select
                                            value={item.fontFamily || 'Helvetica'}
                                            onChange={(e) => updateStyle(k, 'fontFamily', e.target.value)}
                                            className="w-full px-3 py-2 text-[10px] border border-white/10 rounded-xl bg-white/5 text-white font-black uppercase tracking-widest focus:ring-1 focus:ring-brand-purple outline-none transition-all"
                                        >
                                            <option value="Helvetica" className="bg-[#0a0b14]">SANS</option>
                                            <option value="Times-Roman" className="bg-[#0a0b14]">SERIF</option>
                                            <option value="Courier" className="bg-[#0a0b14]">MONO</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {layout.qr && (
                        <div className="flex flex-col gap-4 p-5 border border-brand-cyan/20 rounded-2xl bg-brand-cyan/5 hover:bg-brand-cyan/10 transition-colors relative group">
                            <div className="flex justify-between items-center border-b border-brand-cyan/10 pb-3">
                                <span className="capitalize font-black text-[10px] text-brand-cyan tracking-[0.2em]">VERIFICATION PROTOCOL</span>
                                <button
                                    onClick={() => removeModule('qr')}
                                    className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    title="Remove Module"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center py-2">
                                <QrCode size={32} className="text-brand-cyan opacity-50" />
                            </div>
                            <p className="text-[8px] text-brand-cyan/40 font-black uppercase tracking-widest text-center">AUTOSCALE ENABLED</p>
                        </div>
                    )}
                    {(!layout.name && !layout.event && !layout.college && !layout.date && !layout.qr) && (
                        <div className="col-span-full flex items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">No modules active. Use the ADD RESOURCE menu to calibrate your layout.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div
                    className="relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0a0b14]/50 select-none rounded-[1.5rem]"
                    style={{ width: '842px', height: '595px', transform: 'scale(0.85)', transformOrigin: 'top center' }}
                    ref={containerRef}
                >
                    <img src={templateUrl} alt="Certificate Template" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90" />

                    {/* Overlay to dim template slightly for better editor visibility */}
                    <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                    {/* Render Text Elements */}
                    {['name', 'event', 'college', 'date'].map((k) => {
                        const item = layout[k as keyof CertificateLayout] as Coordinate;
                        if (!item) return null;
                        const isCenter = item.align === 'center';

                        return (
                            <div
                                key={k}
                                onMouseDown={(e) => onMouseDown(e, k)}
                                className={`absolute cursor-move border-2 border-dashed ${isCenter ? 'border-brand-cyan/60' : 'border-brand-purple/60'} hover:border-white px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md z-20 flex items-center justify-center transition-all group active:scale-95 shadow-xl`}
                                style={{
                                    left: isCenter ? '50%' : item.x,
                                    top: item.y,
                                    transform: isCenter ? 'translateX(-50%)' : 'none',
                                    minWidth: isCenter ? '300px' : 'auto',
                                    color: item.color || 'white',
                                    fontSize: `${item.fontSize}px`,
                                    fontFamily: item.fontFamily === 'Times-Roman' ? 'Times New Roman' : item.fontFamily === 'Courier' ? 'Courier New' : 'Arial, sans-serif',
                                    textAlign: isCenter ? 'center' : 'left',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span className="font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                    {k === 'name' ? '{NAME}' : k === 'event' ? '{EVENT}' : k === 'college' ? '{COLLEGE}' : '{DATE}'}
                                </span>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, k, item.fontSize)}
                                    className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition shadow-xl z-30 hover:scale-110"
                                >
                                    <Scaling size={12} className="text-brand-purple" />
                                </div>
                            </div>
                        );
                    })}

                    {/* Render Verification QR */}
                    {layout.qr && (
                        <div
                            onMouseDown={(e) => onMouseDown(e, 'qr')}
                            className="absolute cursor-move border-2 border-dashed border-cyan-400 group bg-white p-1.5 rounded-xl shadow-2xl transition-all active:scale-95"
                            style={{
                                left: layout.qr.x,
                                top: layout.qr.y,
                                width: layout.qr.width,
                                height: layout.qr.width
                            }}
                        >
                            <div className="w-full h-full bg-white flex items-center justify-center overflow-hidden rounded-lg">
                                <QrCode size={layout.qr.width * 0.75} className="text-gray-900" />
                            </div>
                            <div
                                onMouseDown={(e) => handleResizeMouseDown(e, 'qr', layout.qr!.width)}
                                className="absolute -bottom-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-2xl flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition shadow-2xl z-20 hover:scale-110 active:scale-90"
                            >
                                <Scaling size={16} className="text-brand-cyan" />
                            </div>
                            <div className="absolute -top-7 left-0 w-full text-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-cyan bg-[#0a0b14] px-3 py-1 rounded-full border border-brand-cyan/30 shadow-lg backdrop-blur-md">VERIFICATION QR</span>
                            </div>
                        </div>
                    )}

                    {/* Render Images */}
                    {layout.images.map((img) => (
                        <div
                            key={img.id}
                            onMouseDown={(e) => onMouseDown(e, img.id)}
                            className="absolute cursor-move border-2 border-dashed border-brand-purple/60 hover:border-brand-purple group rounded-xl shadow-xl transition-all active:scale-95"
                            style={{
                                left: img.x,
                                top: img.y,
                                width: img.width,
                            }}
                        >
                            <img src={img.src} alt="Upload" className="w-full h-auto pointer-events-none rounded-lg" />
                            <button
                                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-2xl hover:bg-red-600 active:scale-90"
                            >
                                <Trash2 size={14} />
                            </button>
                            <div
                                onMouseDown={(e) => handleResizeMouseDown(e, img.id, img.width)}
                                className="absolute -bottom-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-2xl flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition shadow-2xl z-20 hover:scale-110 active:scale-90"
                            >
                                <Scaling size={16} className="text-brand-purple" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-[-20px] mb-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] bg-white/[0.03] backdrop-blur-md px-10 py-4 rounded-full border border-white/5 shadow-2xl">
                        Protocol: Use <AlignCenter className="inline mx-2 text-brand-purple" size={16} /> to snap elements to horizontal central axis.
                    </p>
                </div>
            </div>
        </div>
    );
};
