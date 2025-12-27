import fs from 'fs/promises';
import path from 'path';
import { Event } from '../models/Event';

const DATA_FILE = path.join(__dirname, '../../data/events.json');

export class EventService {
    private async readData(): Promise<Event[]> {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    }

    private async writeData(data: Event[]): Promise<void> {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    }

    async getEventById(id: string): Promise<Event | undefined> {
        const events = await this.readData();
        return events.find(e => e.id === id);
    }

    async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
        const events = await this.readData();
        const index = events.findIndex(e => e.id === id);

        if (index === -1) return null;

        events[index] = { ...events[index], ...updates };
        await this.writeData(events);

        return events[index];
    }
}
