import { useEffect, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

export const useSSE = (url: string, onMessage: (event: MessageEvent) => void) => {
    // using 'any' to avoid type mismatch between native EventSource and Polyfill if types are missing
    const eventSourceRef = useRef<any>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const connect = () => {
            const token = localStorage.getItem('token');
            console.log("Connecting to SSE...", url);

            if (!token) {
                console.warn("No token found for SSE connection");
                return;
            }

            const eventSource = new EventSourcePolyfill(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log("SSE Connected");
            };

            const handler = (event: MessageEvent) => {
                onMessageRef.current(event);
            };

            eventSource.onmessage = handler;
            eventSource.addEventListener('NEW_MESSAGE', handler);
            eventSource.addEventListener('MESSAGE_STATUS_UPDATE', handler);

            eventSource.onerror = (error: any) => {
                console.error('SSE Error, scheduling reconnect in 5s...', error);

                // Close current connection
                eventSource.close();

                // Clear any existing reconnect timer to avoid multiples
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                // Schedule reconnect
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 5000);
            };
        };

        connect();

        return () => {
            if (eventSourceRef.current) {
                console.log("Closing SSE connection cleanup");
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [url]);

    return eventSourceRef.current;
};