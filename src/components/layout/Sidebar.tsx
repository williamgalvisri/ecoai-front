import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, X, Leaf } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './../ui/button';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const location = useLocation();
    const { t } = useTranslation();

    const links = [
        { icon: LayoutDashboard, label: t('common.inbox'), href: '/inbox', count: 3 },
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

                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4">
                        <LanguageSwitcher />
                    </div>
                    <div className="text-xs text-slate-500">
                        v0.1.0 Beta
                    </div>
                </div>
            </div>
        </>
    )
}
