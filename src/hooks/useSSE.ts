import { useEffect, useRef } from 'react';

export const useSSE = (url: string, onMessage: (event: MessageEvent) => void) => {
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const connect = () => {
            console.log("Connecting to SSE...", url);
            const eventSource = new EventSource(url);
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

            eventSource.onerror = (error) => {
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