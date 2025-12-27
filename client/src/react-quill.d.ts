declare module 'react-quill' {
    import React from 'react';
    export interface ReactQuillProps {
        value?: string;
        defaultValue?: string;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        theme?: string;
        modules?: any;
        formats?: string[];
        bounds?: string | HTMLElement;
        placeholder?: string;
        readOnly?: boolean;
        scrollingContainer?: string | HTMLElement;
        className?: string;
        style?: React.CSSProperties;
        tabIndex?: number;
        children?: React.ReactNode;
        preserveWhitespace?: boolean;
    }
    export default class ReactQuill extends React.Component<ReactQuillProps> { }
}
