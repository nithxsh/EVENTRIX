export interface Event {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    registrationFormUrl: string;
    registrationType: 'google' | 'tally' | 'none';
    googleSheetId?: string;
    tallyEndpoint?: string;
    responses: any[];
    sentEmails?: string[];
    registrationEnabled: boolean;
    registrationLimit?: number;
    collegeName?: string;
    certificateTemplate?: string;
    certificateLayout?: {
        name: { x: number; y: number; fontSize: number; color: string; fontFamily?: string; align?: 'left' | 'center' };
        event: { x: number; y: number; fontSize: number; color: string; fontFamily?: string; align?: 'left' | 'center' };
        date?: { x: number; y: number; fontSize: number; color: string; fontFamily?: string; align?: 'left' | 'center' };
        college?: { x: number; y: number; fontSize: number; color: string; fontFamily?: string; align?: 'left' | 'center' };
        qr?: { x: number; y: number; width: number };
        images?: Array<{ id: string; x: number; y: number; width: number; src: string }>;
    };
}
