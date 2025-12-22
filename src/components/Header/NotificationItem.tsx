import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Circle } from 'lucide-react';
import { type Notification, useNotifications } from '@/context/NotificationBase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useTranslation } from 'react-i18next';
import { enUS, es } from 'date-fns/locale';

interface NotificationItemProps {
    notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
    const { markAsViewed, deleteNotification } = useNotifications();
    const { i18n } = useTranslation();

    const handleClick = () => {
        if (notification.status === 'new') {
            markAsViewed(notification._id);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(notification._id);
    };

    const locale = i18n.language === 'es' ? es : enUS;

    return (
        <div
            className={cn(
                "relative flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 group cursor-pointer border-b last:border-0",
                notification.status === 'new' ? "bg-muted/30" : "bg-background"
            )}
            onClick={handleClick}
        >
            <div className="mt-1">
                {notification.status === 'new' && (
                    <Circle className="h-2 w-2 fill-primary text-primary" />
                )}
            </div>
            <div className="flex-1 space-y-1">
                <p className={cn("text-sm font-medium leading-none", notification.status === 'new' && "font-bold")}>
                    {notification.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })}
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};
