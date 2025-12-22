import { useState, useEffect, type ReactNode } from 'react';
import api from '../services/api'; // Adjust path if needed
import { useSSE } from '../hooks/useSSE';
import { NotificationContext, type Notification } from './NotificationBase';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const unreadCount = notifications.filter(n => n.status === 'new').length;

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/notifications');
            // Backend returns { success: true, data: [...] } structure
            const data = response.data?.data || [];
            if (Array.isArray(data)) {
                setNotifications(data);
            } else {
                console.warn('Unexpected notifications response format:', response.data);
                setNotifications([]);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsViewed = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, status: 'viewed' } : n
            ));

            await api.patch(`/notifications/${id}/viewed`);
        } catch (error) {
            console.error('Failed to mark notification as viewed:', error);
            // Revert if needed, but for viewed status it's usually fine to just log
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n._id !== id));

            await api.delete(`/notifications/${id}`);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            // Could revert here
            fetchNotifications();
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Real-time Updates
    // Using the same URL as the existing SSE hook in the app
    useSSE('http://localhost:3000/events', (event: MessageEvent) => {
        if (event.type === 'NEW_NOTIFICATION') {
            try {
                const newNotification = JSON.parse(event.data);
                setNotifications(prev => [newNotification, ...prev]);
            } catch (err) {
                console.error('Error parsing notification event:', err);
            }
        }
    });

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            markAsViewed,
            deleteNotification,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
