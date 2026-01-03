import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, X, Leaf, LogOut, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './../ui/button';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../Header/NotificationBell';

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const links = [
        { icon: LayoutDashboard, label: t('common.inbox'), href: '/inbox', count: 3 },
        { icon: ShoppingCart, label: t('orders.title'), href: '/orders' },
        { icon: Calendar, label: t('common.calendar'), href: '/calendar' }, // Need key for calendar? defaulting to literal or add key later
        { icon: Users, label: t('common.contacts'), href: '/contacts' },
        { icon: Settings, label: t('common.settings'), href: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white text-lg">
                        <Leaf className="h-6 w-6 text-emerald-400" />
                        <span>Eco AI</span>
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-800 text-white"
                                        : "hover:bg-slate-800/50 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-4">
                    {/* Compact Language Switcher */}
                    <div className="flex bg-slate-800/50 rounded-lg p-1">
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={cn(
                                "flex-1 text-xs font-medium py-1 rounded transition-colors",
                                i18n.language === 'en' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('es')}
                            className={cn(
                                "flex-1 text-xs font-medium py-1 rounded transition-colors",
                                i18n.language === 'es' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            ES
                        </button>
                    </div>

                    {/* User Profile + Notification Bell */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="h-9 w-9 rounded-full bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center">
                            {user.photoUrl ? (
                                <img src={user.photoUrl} alt="User" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <span className="text-emerald-500 font-semibold text-sm">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate capitalize">
                                {user.subscriptionPlan || 'Free'} Plan
                            </p>
                        </div>

                        <NotificationBell />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
