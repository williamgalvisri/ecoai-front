import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Contact {
    _id: string;
    phoneNumber: string;
    name?: string;
    notes?: string;
    lastInteraction?: string;
    isBotActive: boolean;
}

export interface Appointment {
    _id: string;
    contactId: Contact;
    dateTime: string;
    endTime?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    service?: string;
}

export interface Service {
    name: string;
    description?: string;
    duration?: number;
    price?: number;
}

export interface BusinessHours {
    [key: string]: {
        open: string;
        close: string;
        isOpen: boolean;
    };
}

export interface BusinessContext {
    services: Service[];
    hours: BusinessHours;
    location?: string;
    contactPhone?: string;
}

export interface AppointmentSettings {
    defaultDuration: number;
    bufferTime: number;
    timezone: string;
}

export interface ReminderSettings {
    isEnabled: boolean;
    hoursBefore: number;
}

export interface SettingsResponse {
    reminderSettings: ReminderSettings;
    appointmentSettings: AppointmentSettings;
    businessContext: BusinessContext;
}

// Contacts
export const getContacts = async () => {
    const response = await api.get('/dashboard/contacts');
    return response.data.data; // Assuming standardized response { status: 'success', data: [...] }
};

export const toggleBot = async (contactId: string, isBotActive: boolean) => {
    const response = await api.post(`/dashboard/contacts/${contactId}/toggle-bot`, { isBotActive });
    return response.data.data;
};

// Appointments
export const getAppointments = async (params?: { start?: string; end?: string }) => {
    const response = await api.get('/dashboard/appointments', { params });
    return response.data.data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const response = await api.put(`/dashboard/appointments/${id}`, updates);
    return response.data.data;
};

// Messages
export const sendMessage = async (userPhone: string, message: string) => {
    const response = await api.post('/chat', { userPhone, message });
    return response.data.data;
}

export const getChatHistory = async (contactId: string, params?: { limit?: number; before?: string }) => {
    const response = await api.get(`/dashboard/contacts/${contactId}/messages`, { params });
    return response.data.data;
};

export const getSettings = async (): Promise<SettingsResponse> => {
    const response = await api.get('/dashboard/settings');
    return response.data.data;
};

export const updateSettings = async (settings: Partial<SettingsResponse>) => {
    const response = await api.put('/dashboard/settings', settings);
    return response.data.data;
};

export default api;
