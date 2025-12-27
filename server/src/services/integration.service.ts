import axios from 'axios';
import { parse } from 'csv-parse/sync';

export class IntegrationService {

    // MVP Strategy: Fetch via "Publish to Web" CSV link for instant no-auth access
    // This requires the user to File -> Share -> Publish to web -> CSV
    // MVP Strategy: Fetch via Google Sheets API (if auth) or "Publish to Web" CSV (fallback)
    // MVP Strategy: Fetch via Google Sheets API (if auth) or "Publish to Web" CSV (fallback)
    async fetchGoogleSheetData(sheetId: string, accessToken?: string): Promise<any[]> {
        let rawRecords: any[] = [];

        try {
            // OPTION 1: Authenticated API Call (Private Sheets)
            if (accessToken) {
                console.log("Fetching private sheet with Access Token...");
                try {
                    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z`;
                    const response = await axios.get(apiUrl, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });

                    const rows = response.data.values;
                    if (rows && rows.length > 0) {
                        // Convert Array of Arrays to Array of Objects
                        const headers = rows[0];
                        rawRecords = rows.slice(1).map((row: any[]) => {
                            const record: any = {};
                            headers.forEach((header: string, index: number) => {
                                record[header] = row[index];
                            });
                            return record;
                        });
                        console.log(`Fetched ${rawRecords.length} records via API`);
                    }
                } catch (apiError) {
                    console.error("API Fetch failed, trying fallback CSV...", apiError);
                }
            }

            // OPTION 2: Fallback to Public CSV (if API failed or no token)
            if (rawRecords.length === 0) {
                const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                console.log("Fetching Google Sheet (CSV fallback):", csvUrl);
                const response = await axios.get(csvUrl);

                rawRecords = parse(response.data, {
                    columns: true,
                    skip_empty_lines: true
                });
                console.log(`Fetched ${rawRecords.length} records via CSV`);
            }

            // Normalize Data
            return rawRecords.map((record: any) => {
                // Heuristic to find Name column
                const keys = Object.keys(record);
                // Heuristic to find Name column
                const nameKey = keys.find(k => k.match(/name|student/i)) || keys[1];
                const emailKey = keys.find(k => k.match(/email|mail/i)) || keys[2];
                const eventKey = keys.find(k => k.match(/event|participated|contest/i));

                const normalized = {
                    name: record['Name'] || record['Full Name'] || (nameKey ? record[nameKey] : 'Unknown'),
                    email: record['Email'] || record['Email Address'] || (emailKey ? record[emailKey] : ''),
                    eventName: eventKey ? record[eventKey] : null, // Capture Event Name
                    phone: record['Phone'] || record['Mobile'] || '',
                    college: record['College'] || record['Organization'] || '',
                    department: record['Department'] || record['Dept'] || '',
                    year: record['Year'] || ''
                };
                return normalized;
            });

        } catch (error) {
            console.error("Error fetching Google Sheet:", error);
            return [];
        }
    }

    async fetchTallyData(url: string): Promise<any[]> {
        try {
            // Tally Public API or Webhook data needed here. 
            // For MVP, if they provide a public results JSON URL (rare), we use it.
            // Otherwise, we might need a Personal Access Token.
            // Let's assume for now the user might paste a Tally API endpoint.
            // If they paste a regular form URL, we can't scrape it easily.
            // Placeholder implementation:
            return [];
        } catch (error) {
            console.error("Error fetching Tally data:", error);
            return [];
        }
    }
}
