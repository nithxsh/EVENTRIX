import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import QRCode from 'qrcode';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async generateCertificate(templatePath: string, name: string, eventName: string, collegeName: string = '', layout?: any, verificationUrl?: string): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            try {
                // Load template image covering the whole A4 Landscape
                doc.image(templatePath, 0, 0, { width: 841.89, height: 595.28 });

                // Add Images (Signatures, Logos)
                if (layout?.images && Array.isArray(layout.images)) {
                    for (const img of layout.images) {
                        try {
                            if (img.src && img.src.startsWith('data:image')) {
                                console.log(`Rendering image at x:${img.x}, y:${img.y}, width:${img.width}`);
                                doc.image(img.src, img.x, img.y, { width: img.width });
                            }
                        } catch (e) {
                            console.error('Failed to render custom image on certificate', e);
                        }
                    }
                }

                // Render Verification QR Code
                if (layout?.qr && layout.qr.width > 0) {
                    try {
                        const verificationData = verificationUrl || `Verified: ${name} | ${eventName} | ${collegeName}`;
                        console.log(`Rendering QR Code at x:${layout.qr.x}, y:${layout.qr.y}, width:${layout.qr.width}`);
                        const qrBuffer = await QRCode.toBuffer(verificationData, { margin: 1 });
                        doc.image(qrBuffer, layout.qr.x, layout.qr.y, { width: layout.qr.width });
                    } catch (e) {
                        console.error('Failed to render QR Code on certificate', e);
                    }
                }

                // Helper to render text with layout support
                const renderText = (text: string, style: any, defaultY: number, size: number, label: string) => {
                    // Skip if style specifically set to null (modularly deleted) or not provided
                    if (!text || !style) return;

                    const x = style?.x ?? 420;
                    const y = style?.y ?? defaultY;
                    const fontSize = style?.fontSize ?? size;
                    const color = style?.color ?? '#000000';
                    const align = style?.align ?? 'center';
                    const font = style?.fontFamily ?? 'Helvetica';

                    console.log(`Rendering [${label}]: "${text}" at x:${x}, y:${y}, size:${fontSize}, align:${align}`);

                    // Use standard PDF fonts
                    let pdfFont = 'Helvetica-Bold';
                    if (font === 'Times-Roman') pdfFont = 'Times-Bold';
                    if (font === 'Courier') pdfFont = 'Courier-Bold';

                    doc.font(pdfFont)
                        .fontSize(fontSize)
                        .fillColor(color)
                        .text(text, align === 'center' ? 0 : x, y, {
                            align: align,
                            width: align === 'center' ? 841.89 : 841.89 - (x || 0)
                        });
                };

                // Render Elements only if their layout is defined (modularly enabled)
                if (layout?.name) renderText(name, layout.name, 300, 30, 'Name');
                if (layout?.event) renderText(eventName, layout.event, 400, 20, 'Event');
                if (layout?.college) renderText(collegeName, layout.college, 100, 15, 'College');
                if (layout?.date && typeof layout.date === 'object') {
                    const dateStr = new Date().toLocaleDateString();
                    renderText(dateStr, layout.date, 500, 15, 'Date');
                }

                doc.end();
            } catch (error) {
                console.error("PDF Generation Internal Error:", error);
                reject(error);
            }
        });
    }

    async sendEmail(to: string, subject: string, html: string, attachmentBuffer?: Buffer, attachmentName?: string) {
        const mailOptions: any = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html // Send as HTML
        };

        if (attachmentBuffer && attachmentName) {
            mailOptions.attachments = [{
                filename: attachmentName,
                content: attachmentBuffer
            }];
        }

        return this.transporter.sendMail(mailOptions);
    }
}
