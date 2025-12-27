import { Request, Response } from 'express';
import { EventService } from '../services/event.service';
import { IntegrationService } from '../services/integration.service';

const eventService = new EventService();
const integrationService = new IntegrationService();
const OWNER_EMAIL = 'warannithish32@gmail.com';

const isOwner = (user: any) => {
    // For Development: Allow any logged in user
    console.log("Checking ownership for user:", user);
    return !!user;
}

export const getEvent = async (req: Request, res: Response) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    console.log("Update Event Request Received for ID:", req.params.id);
    console.log("Request Body:", req.body);
    console.log("User in Request:", req.user);

    try {
        const event = await eventService.getEventById(req.params.id);
        if (!event) {
            console.log("Event not found");
            return res.status(404).json({ message: 'Event not found' });
        }

        // Enforce Email-based ownership
        // if (!isOwner(req.user)) {
        //    console.log("Ownership check failed user is undefined or null");
        //    return res.status(403).json({ message: "Unauthorized" });
        // }

        const updatedEvent = await eventService.updateEvent(req.params.id, req.body);
        console.log("Event updated successfully");
        res.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEventRegistrations = async (req: Request, res: Response) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Enforce Email-based ownership
        if (!isOwner(req.user)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        let registrations: any[] = [];
        // @ts-ignore - accessToken is attached in passport config
        const accessToken = req.user?.accessToken;

        if (event.registrationType === 'google' && event.googleSheetId) {
            registrations = await integrationService.fetchGoogleSheetData(event.googleSheetId, accessToken);
        } else if (event.registrationType === 'tally' && event.tallyEndpoint) {
            registrations = await integrationService.fetchTallyData(event.tallyEndpoint);
        }

        // Add Status tracking
        const sentEmails = event.sentEmails || [];
        const enrichedRegistrations = registrations.map(r => ({
            ...r,
            status: sentEmails.includes(r.email) ? 'Sent' : 'Registered'
        }));

        res.json(enrichedRegistrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch registrations' });
    }
};

import { EmailService } from '../services/email.service';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const emailService = new EmailService();

export const sendEventEmails = async (req: Request, res: Response) => {
    try {
        console.log("Email Request Received");
        // @ts-ignore
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let certTemplate = files['certTemplate']?.[0] || files['certificateTemplate']?.[0];
        const recipientFile = files['recipientFile']?.[0]; // Uploaded CSV/Excel

        const { emailType, recipientSource, subject, message } = req.body;
        let collegeName = req.body.collegeName;

        const eventId = req.params.id;
        const event = await eventService.getEventById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // --- PROTOCOL: Hierarchical Data Calibration ---

        // 1. Resolve Layout (Override > Stored)
        let certLayout = event.certificateLayout;
        if (req.body.certificateLayout) {
            try {
                certLayout = JSON.parse(req.body.certificateLayout);
                console.log("Using session-override layout protocol");
            } catch (e) {
                console.error("Layout parsing failure:", e);
            }
        }

        // 2. Resolve Template (Override > Stored)
        let templatePath = certTemplate?.path || event.certificateTemplate;
        console.log("Resolved Template Path:", templatePath);

        // 3. Resolve College Identity
        if (!collegeName) collegeName = event.collegeName || '';

        // --- PROTOCOL: Auto-Persistence Synchronization ---
        const updates: any = {};
        if (certTemplate && certTemplate.path !== event.certificateTemplate) {
            updates.certificateTemplate = certTemplate.path;
        }
        if (req.body.certificateLayout && JSON.stringify(certLayout) !== JSON.stringify(event.certificateLayout)) {
            updates.certificateLayout = certLayout;
        }
        if (req.body.collegeName && req.body.collegeName !== event.collegeName) {
            updates.collegeName = req.body.collegeName;
        }

        if (Object.keys(updates).length > 0) {
            console.log("Synchronizing Protocol updates to Database:", Object.keys(updates));
            await eventService.updateEvent(eventId, updates);
        }

        let recipients: any[] = [];
        // ... Determine Recipients logic ...
        if (recipientSource === 'live') {
            // @ts-ignore
            const accessToken = req.user?.accessToken;
            if (event.googleSheetId) {
                recipients = await integrationService.fetchGoogleSheetData(event.googleSheetId, accessToken);
            }
        } else if (recipientSource === 'upload' && recipientFile) {
            const fileContent = fs.readFileSync(recipientFile.path, 'utf-8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true });
            recipients = records.map((r: any) => ({
                name: r['Name'] || r['name'] || Object.values(r)[0],
                email: r['Email'] || r['email'] || Object.values(r)[1]
            }));
        }

        let selectedEmails: string[] = [];
        if (req.body.selectedEmails) {
            try { selectedEmails = JSON.parse(req.body.selectedEmails); } catch (e) { }
        }

        if (selectedEmails.length > 0) {
            recipients = recipients.filter(r => selectedEmails.includes(r.email));
        }

        console.log(`Executing transmission for ${recipients.length} targets...`);
        let sentCount = 0;

        for (const recipient of recipients) {
            if (!recipient?.email) continue;

            const specificEventName = recipient.eventName || event.title;
            const finalMessage = message
                .replace(/{{Name}}/g, recipient.name || 'Participant')
                .replace(/{{Event}}/g, specificEventName)
                .replace(/{{College}}/g, collegeName || '');

            let attachmentBuffer: Buffer | undefined;
            let attachmentName: string | undefined;

            try {
                if (emailType === 'certificate' && templatePath) {
                    const verifyHash = Buffer.from(`${recipient.email}:${eventId}`).toString('base64');
                    const verificationUrl = `http://localhost:3000/verify/${verifyHash}`;

                    attachmentBuffer = await emailService.generateCertificate(
                        templatePath,
                        recipient.name || 'Participant',
                        specificEventName,
                        collegeName || '',
                        certLayout,
                        verificationUrl
                    );
                    attachmentName = 'Certificate.pdf';
                }

                await emailService.sendEmail(
                    recipient.email,
                    subject,
                    finalMessage,
                    attachmentBuffer,
                    attachmentName
                );
                sentCount++;
            } catch (err) {
                console.error(`Transmission failed for ${recipient.email}:`, err);
            }
        }

        // --- PROTOCOL: Post-Transmission Finale ---
        console.log(`Transmission sequence complete. Total units sent: ${sentCount}`);

        // Cleanup uploaded files
        try {
            if (certTemplate) fs.unlinkSync(certTemplate.path);
            if (recipientFile) fs.unlinkSync(recipientFile.path);
        } catch (cleanupErr) {
            console.error("Cleanup Protocol Failure:", cleanupErr);
        }

        res.json({ message: `Emails sent to ${sentCount} recipients.`, sent: sentCount });
    } catch (error) {
        console.error("Critical Email Protocol Failure:", error);
        res.status(500).json({ message: 'Failed to execute transmission broadside' });
    }
};

export const verifyCertificate = async (req: any, res: any) => {
    try {
        const { hash } = req.params;
        const decoded = Buffer.from(hash, 'base64').toString('utf-8');
        const [email, eventId] = decoded.split(':');

        const event = await eventService.getEventById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Assuming event.responses holds registration data with email and name
        // This might need adjustment based on your actual event schema
        const registration = event.responses?.find((r: any) => r.email === email);
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        res.json({
            name: registration.name,
            email: registration.email,
            eventName: registration.eventName || event.title,
            college: registration.college || event.collegeName || '',
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Certificate verification error:", error);
        res.status(400).json({ message: 'Invalid verification hash or server error' });
    }
};

export const getLivePulse = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const event = await eventService.getEventById(id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Get latest 10 registrations
        // Assuming event.responses is an array of registration objects
        const recentResponses = [...(event.responses || [])].reverse().slice(0, 10);

        res.json({
            title: event.title,
            college: event.collegeName || '',
            totalRegistrations: event.responses?.length || 0,
            recent: recentResponses.map((r: any) => ({
                name: r.name,
                college: r.college || '',
                timestamp: r.timestamp || new Date().toISOString() // Fallback
            }))
        });
    } catch (error) {
        console.error("Live pulse fetch error:", error);
        res.status(500).json({ message: 'Failed to fetch live pulse' });
    }
};
