import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationBase';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
    const { t } = useTranslation();
    const { notifications, unreadCount, markAsViewed } = useNotifications();
    const [open, setOpen] = React.useState(false);

    const handleMarkAllRead = () => {
        // Find all unread and mark them
        notifications.filter(n => n.status === 'new').forEach(n => {
            markAsViewed(n._id);
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[9px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="font-semibold">{t('notifications.title')}</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={handleMarkAllRead}>
                            {t('notifications.mark_all_read')}
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">{t('notifications.empty')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <NotificationItem key={notification._id} notification={notification} />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
