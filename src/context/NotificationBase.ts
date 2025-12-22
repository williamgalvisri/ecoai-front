import { createContext, useContext } from 'react';

export interface Notification {
    _id: string;
    ownerId: string;
    type: string;
    title: string;
    message: string;
    relatedResourceId?: string;
    status: 'new' | 'viewed' | 'deleted';
    createdAt: string;
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    markAsViewed: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
