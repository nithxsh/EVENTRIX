import React, { useRef } from 'react';
import { Bold, Italic, List, Link as LinkIcon } from 'lucide-react';

interface SimpleRichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({ value, onChange, placeholder, className }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className={`border rounded-[1.5rem] overflow-hidden bg-white/5 border-white/10 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
                <button onClick={() => exec('bold')} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Bold">
                    <Bold size={16} />
                </button>
                <button onClick={() => exec('italic')} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Italic">
                    <Italic size={16} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onClick={() => exec('insertUnorderedList')} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Bullet List">
                    <List size={16} />
                </button>
                <button onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) exec('createLink', url);
                }} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Link">
                    <LinkIcon size={16} />
                </button>
            </div>

            {/* Editable Area */}
            <div className="relative">
                <div
                    ref={editorRef}
                    className="p-6 min-h-[200px] outline-none prose prose-invert prose-sm max-w-none text-white font-medium"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: value }}
                />
                {!value && placeholder && (
                    <div className="absolute top-6 left-6 text-gray-700 pointer-events-none text-sm font-bold uppercase tracking-widest italic">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
};
