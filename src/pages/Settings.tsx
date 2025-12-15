import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, type Service, type BusinessHours } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch'; // Assuming you have this or use simple checkbox/button logic
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Bell, Save, CheckCircle, User, Briefcase, Plus, Trash2, Edit2, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Settings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaved, setIsSaved] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

    // Local State for Forms
    const [reminderSettings, setReminderSettings] = useState({ isEnabled: true, hoursBefore: 24 });
    const [apptSettings, setApptSettings] = useState({ defaultDuration: 30, bufferTime: 5, timezone: 'America/Bogota' });
    const [businessContext, setBusinessContext] = useState({
        services: [] as Service[],
        hours: {} as BusinessHours,
        location: '',
        contactPhone: ''
    });

    // Service Dialog State
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
    const [currentService, setCurrentService] = useState<Service>({ name: '', price: 0, duration: 30, description: '' });


    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
    });

    useEffect(() => {
        if (settings) {
            if (settings.reminderSettings) setReminderSettings(settings.reminderSettings);
            if (settings.appointmentSettings) setApptSettings(settings.appointmentSettings);
            if (settings.businessContext) {
                // Ensure hours objects exist for all days
                const mergedHours = { ...settings.businessContext.hours };
                DAYS.forEach(day => {
                    if (!mergedHours[day]) mergedHours[day] = { open: '08:00', close: '18:00', isOpen: day !== 'sunday' };
                });

                setBusinessContext({
                    ...settings.businessContext,
                    hours: mergedHours,
                    services: settings.businessContext.services || []
                });
            }
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        },
    });

    const handleSave = () => {
        mutation.mutate({
            reminderSettings,
            appointmentSettings: apptSettings,
            businessContext
        });
    };

    // Service Handlers
    const handleAddService = () => {
        setEditingServiceIndex(null);
        setCurrentService({ name: '', price: 0, duration: apptSettings.defaultDuration, description: '' });
        setIsServiceDialogOpen(true);
    };

    const handleEditService = (index: number) => {
        setEditingServiceIndex(index);
        setCurrentService({ ...businessContext.services[index] });
        setIsServiceDialogOpen(true);
    };

    const handleSaveService = () => {
        const newServices = [...businessContext.services];
        if (editingServiceIndex !== null) {
            newServices[editingServiceIndex] = currentService;
        } else {
            newServices.push(currentService);
        }
        setBusinessContext({ ...businessContext, services: newServices });
        setIsServiceDialogOpen(false);
    };

    const handleDeleteService = (index: number) => {
        const newServices = businessContext.services.filter((_, i) => i !== index);
        setBusinessContext({ ...businessContext, services: newServices });
    };

    // Hours Handler
    const handleHourChange = (day: string, field: string, value: any) => {
        setBusinessContext(prev => ({
            ...prev,
            hours: {
                ...prev.hours,
                [day]: {
                    ...prev.hours[day],
                    [field]: value
                }
            }
        }));
    };


    const menuItems = [
        { id: 'general', label: t('settings.tabs.general_hours.header.title'), icon: Briefcase },
        { id: 'services', label: t('settings.tabs.services.header.title'), icon: User },
        { id: 'reminders', label: t('settings.tabs.reminders.header.title'), icon: Bell },
    ];

    if (isLoading) return <div className="p-8 text-slate-500">Loading settings...</div>;

    return (
        <div className="flex h-full bg-slate-50 text-slate-900">
            {/* Sidebar */}
            <aside className={cn(
                "w-full lg:w-64 border-r border-slate-200 bg-white shrink-0",
                isMobileMenuOpen ? "block" : "hidden lg:block"
            )}>
                <div className="p-6">
                    <h2 className="text-xl font-semibold tracking-tight mb-6">{t('common.settings')}</h2>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        activeTab === item.id
                                            ? "bg-slate-100 text-slate-900"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 overflow-y-auto",
                !isMobileMenuOpen ? "block" : "hidden lg:block"
            )}>
                <div className="max-w-4xl mx-auto p-4 md:p-12 pb-24">
                    <div className="mb-6 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden -ml-2"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <ChevronLeft className="h-5 w-5 text-slate-600" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    {menuItems.find(i => i.id === activeTab)?.label}
                                </h1>
                                <p className="text-slate-500 text-sm">{t('settings.tabs.general_hours.header.subtitle')}</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            size="sm"
                            className={cn(
                                "min-w-[120px] md:min-w-[140px] transition-all",
                                isSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                            )}
                        >
                            {mutation.isPending ? t('common.saving') : isSaved ? <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {t('common.saved')}</span> : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> {t('common.save_changes')}</span>}
                        </Button>
                    </div>

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{t('settings.tabs.general_hours.bussines_information.header.title')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('settings.tabs.general_hours.bussines_information.location')}</Label>
                                            <Input
                                                value={businessContext.location}
                                                onChange={(e) => setBusinessContext({ ...businessContext, location: e.target.value })}
                                                placeholder="e.g. 123 Main St, New York"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('settings.tabs.general_hours.bussines_information.contact_phone')}</Label>
                                            <Input
                                                value={businessContext.contactPhone}
                                                onChange={(e) => setBusinessContext({ ...businessContext, contactPhone: e.target.value })}
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('settings.tabs.general_hours.bussines_information.default_duration')} (min)</Label>
                                            <Input type="number" value={apptSettings.defaultDuration} onChange={(e) => setApptSettings({ ...apptSettings, defaultDuration: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('settings.tabs.general_hours.bussines_information.buffer_time')} (min)</Label>
                                            <Input type="number" value={apptSettings.bufferTime} onChange={(e) => setApptSettings({ ...apptSettings, bufferTime: Number(e.target.value) })} />
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{t('settings.tabs.general_hours.bussines_hours.header.title')}</CardTitle>
                                    <CardDescription>{t('settings.tabs.general_hours.bussines_hours.header.subtitle')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {DAYS.map(day => {
                                            const schedule = businessContext.hours[day] || { open: '09:00', close: '18:00', isOpen: false };
                                            return (
                                                <div key={day} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-50">
                                                    <div className="w-32 capitalize font-medium text-slate-700">{t(`settings.tabs.general_hours.bussines_hours.${day}` as any)}</div>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => handleHourChange(day, 'isOpen', !schedule.isOpen)}
                                                            className={cn("text-xs font-semibold px-2 py-1 rounded transition-colors w-16 text-center", schedule.isOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}
                                                        >
                                                            {schedule.isOpen ? t('settings.tabs.general_hours.bussines_hours.open') : t('settings.tabs.general_hours.bussines_hours.closed')}
                                                        </button>
                                                        {schedule.isOpen ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="time"
                                                                    className="w-32 h-8"
                                                                    value={schedule.open}
                                                                    onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                                                                />
                                                                <span className="text-slate-400">-</span>
                                                                <Input
                                                                    type="time"
                                                                    className="w-32 h-8"
                                                                    value={schedule.close}
                                                                    onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[270px] text-center text-sm text-slate-400 italic">{t('settings.tabs.general_hours.bussines_hours.no_appointments')}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{t('settings.tabs.services.service.header.title')}</h3>
                                <Button onClick={handleAddService} size="sm" className="gap-2"><Plus className="h-4 w-4" /> {t('settings.tabs.services.service.modal.add_new_service.title')}</Button>
                            </div>

                            <div className="grid gap-4">
                                {businessContext.services.length === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                                        <p className="text-slate-500">No services added yet.</p>
                                    </div>
                                )}
                                {businessContext.services.map((service, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{service.name}</h4>
                                            <p className="text-sm text-slate-500">{service.description || t('common.no_description')}</p>
                                            <div className="flex gap-4 mt-1 text-xs font-medium text-slate-600">
                                                <span>${service.price}</span>
                                                <span>•</span>
                                                <span>{service.duration || apptSettings.defaultDuration} mins</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditService(idx)}><Edit2 className="h-4 w-4 text-slate-400 hover:text-indigo-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteService(idx)}><Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REMINDERS TAB */}
                    {activeTab === 'reminders' && (
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle>{t('settings.tabs.reminders.whatsapp_reminder.header.title')}</CardTitle>
                                <CardDescription>{t('settings.tabs.reminders.whatsapp_reminder.header.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="space-y-0.5">
                                        <label className="text-slate-900 font-medium block">{t('settings.tabs.reminders.whatsapp_reminder.enable_remainders')}</label>
                                        <span className="text-sm text-slate-500">{t('settings.tabs.reminders.whatsapp_reminder.send_message_automatically')}</span>
                                    </div>
                                    <button
                                        onClick={() => setReminderSettings({ ...reminderSettings, isEnabled: !reminderSettings.isEnabled })}
                                        className={cn(
                                            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                            reminderSettings.isEnabled ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm", reminderSettings.isEnabled ? "translate-x-6" : "translate-x-1")} />
                                    </button>
                                </div>
                                <div className={cn("space-y-4 transition-all duration-300", !reminderSettings.isEnabled && "opacity-50 grayscale")}>
                                    <div className="flex items-center gap-3">
                                        <Label>{t('settings.tabs.reminders.whatsapp_reminder.hours_before')}</Label>
                                        <Input
                                            type="number"
                                            value={reminderSettings.hoursBefore}
                                            onChange={(e) => setReminderSettings({ ...reminderSettings, hoursBefore: Number(e.target.value) })}
                                            disabled={!reminderSettings.isEnabled}
                                            className="w-24"
                                            min={1}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* SERVICE DIALOG */}
                <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingServiceIndex !== null ? t('settings.tabs.services.service.modal.add_new_service.title') : t('settings.tabs.services.service.modal.add_new_service.title')}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">{t('settings.tabs.services.service.modal.add_new_service.name')}</Label>
                                <Input className="col-span-3" value={currentService.name} onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">{t('settings.tabs.services.service.modal.add_new_service.description')}</Label>
                                <Input className="col-span-3" value={currentService.description} onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">{t('settings.tabs.services.service.modal.add_new_service.price')} ($)</Label>
                                <Input type="number" className="col-span-3" value={currentService.price} onChange={(e) => setCurrentService({ ...currentService, price: Number(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">{t('settings.tabs.services.service.modal.add_new_service.duration')} (min)</Label>
                                <Input type="number" className="col-span-3" value={currentService.duration} onChange={(e) => setCurrentService({ ...currentService, duration: Number(e.target.value) })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>{t('common.close')}</Button>
                            <Button onClick={handleSaveService}>{t('common.save_changes')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
