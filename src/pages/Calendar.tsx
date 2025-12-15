import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppointments, updateAppointment, type Appointment } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight, Clock, User, Info } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    subDays,
    addYears,
    subYears,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    setHours,
    setMinutes,
    isWithinInterval,
    startOfDay,
    endOfDay
} from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

type ViewType = 'day' | 'month' | 'year';

export default function CalendarPage() {
    const { t, i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('month');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const queryClient = useQueryClient();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    // Calculate date range based on view
    const dateRange = useMemo(() => {
        let start, end;
        switch (view) {
            case 'day':
                start = startOfDay(currentDate);
                end = endOfDay(currentDate);
                break;
            case 'month':
                // Include padding days for the grid
                start = startOfWeek(startOfMonth(currentDate));
                end = endOfWeek(endOfMonth(currentDate));
                break;
            case 'year':
                start = startOfYear(currentDate);
                end = endOfYear(currentDate);
                break;
            default:
                start = startOfWeek(startOfMonth(currentDate));
                end = endOfWeek(endOfMonth(currentDate));
        }
        return { start: start.toISOString(), end: end.toISOString() };
    }, [currentDate, view]);

    const { data: appointments = [] } = useQuery({
        queryKey: ['appointments', dateRange, view], // Include dateRange and view in key
        queryFn: () => getAppointments(dateRange),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: any }) => updateAppointment(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });

    const handleStatusChange = (newStatus: string) => {
        if (!selectedAppointment) return;
        // Optimistic local update for the dialog
        setSelectedAppointment({ ...selectedAppointment, status: newStatus as any });
        // Trigger Server update
        updateStatusMutation.mutate({ id: selectedAppointment._id, status: newStatus });
    };

    // Navigation Handlers
    const next = () => {
        if (view === 'day') setCurrentDate(addDays(currentDate, 1));
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        if (view === 'year') setCurrentDate(addYears(currentDate, 1));
    };

    const prev = () => {
        if (view === 'day') setCurrentDate(subDays(currentDate, 1));
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        if (view === 'year') setCurrentDate(subYears(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    // data filtering (still need client side filter for status)
    const filteredAppointments = appointments.filter((apt: Appointment) => {
        if (statusFilter === 'all') return true;
        return apt.status === statusFilter;
    });

    const getAppointmentsForDay = (day: Date) => {
        return filteredAppointments.filter((apt: Appointment) => isSameDay(new Date(apt.dateTime), day));
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <div className="flex flex-col gap-4 p-4 border-b bg-white sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                            {view === 'year' ? format(currentDate, 'yyyy', { locale: dateLocale }) : format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                            {view === 'day' && <span className="hidden sm:inline text-lg font-normal text-slate-500 ml-2">{format(currentDate, 'do, EEEE', { locale: dateLocale })}</span>}
                        </h1>
                        {view === 'day' && (
                            <span className="sm:hidden text-xs text-slate-500 font-medium mt-1">
                                {format(currentDate, 'EEEE, MMMM do', { locale: dateLocale })}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center border rounded-md bg-white shadow-sm shrink-0">
                        <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-2 font-normal text-xs sm:text-sm">
                            {t('common.dashboard') === 'Panel de Control' ? 'Hoy' : 'Today'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* View Switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-lg shrink-0">
                        <button
                            onClick={() => setView('day')}
                            className={cn("px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all", view === 'day' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                        >{t('calendar.day')}</button>
                        <button
                            onClick={() => setView('month')}
                            className={cn("px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all", view === 'month' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                        >{t('calendar.month')}</button>
                        <button
                            onClick={() => setView('year')}
                            className={cn("px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all", view === 'year' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                        >{t('calendar.year')}</button>
                    </div>

                    <div className="hidden sm:block h-6 w-px bg-slate-200" />

                    <Select
                        className="w-full sm:w-[150px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t('common.status.all_status')}</option>
                        <option value="pending">{t('common.status.pending')}</option>
                        <option value="confirmed">{t('common.status.confirmed')}</option>
                        <option value="completed">{t('common.status.completed')}</option>
                        <option value="cancelled">{t('common.status.cancelled')}</option>
                    </Select>
                </div>
            </div>
        </div>
    );

    // Helper for cohesive and accessible status colors
    const getStatusStyles = (status: string, view: 'day' | 'month' = 'month') => {
        const s = status || 'pending';

        // Month view (Compact 'pill' style) - High contrast, intense
        if (view === 'month') {
            switch (s) {
                case 'confirmed': return "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700";
                case 'completed': return "bg-blue-600 text-white shadow-sm hover:bg-blue-700";
                case 'cancelled': return "bg-rose-600 text-white opacity-90 decoration-line-through hover:bg-rose-700";
                case 'pending': return "bg-amber-500 text-white shadow-sm hover:bg-amber-600";
                default: return "bg-slate-600 text-white hover:bg-slate-700";
            }
        }

        // Day view (Cards) - Lighter bg for readability, strong accent border
        switch (s) {
            case 'confirmed':
                return "bg-emerald-50 border-emerald-200 border-l-[3px] border-l-emerald-500 text-emerald-900";
            case 'completed':
                return "bg-blue-50 border-blue-200 border-l-[3px] border-l-blue-500 text-blue-900";
            case 'cancelled':
                return "bg-rose-50 border-rose-200 border-l-[3px] border-l-rose-500 text-rose-900 decoration-line-through opacity-75";
            case 'pending':
                return "bg-amber-50 border-amber-200 border-l-[3px] border-l-amber-500 text-amber-900";
            default:
                return "bg-slate-50 border-slate-200 border-l-[3px] border-l-slate-500 text-slate-700";
        }
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        const weekDays = [
            t('calendar.sunday'),
            t('calendar.monday'),
            t('calendar.tuesday'),
            t('calendar.wednesday'),
            t('calendar.thursday'),
            t('calendar.friday'),
            t('calendar.saturday')
        ];

        // Shorten days for header if needed, or assume keys are full names and we want short.
        // Let's use 3 letter slice for now or improved keys later.
        // Actually, let's keep it simple and just use the first 3 chars of the translated string
        const shortWeekDays = weekDays.map(d => d.substring(0, 3));

        return (
            <div className="flex-1 flex flex-col bg-slate-200 border-b overflow-hidden overflow-x-auto">
                <div className="grid grid-cols-7 gap-px border-b bg-slate-200 shrink-0 min-w-[800px]">
                    {shortWeekDays.map((day) => (
                        <div key={day} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>
                <div className={cn("flex-1 grid grid-cols-7 gap-px bg-slate-200 min-w-[800px] overflow-y-auto", calendarDays.length / 7 === 6 ? "grid-rows-6" : "grid-rows-5")}>
                    {calendarDays.map((day) => {
                        const dayAppointments = getAppointmentsForDay(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        const MAX_VISIBLE = 3;
                        const visibleAppointments = dayAppointments.slice(0, MAX_VISIBLE);
                        const overflowCount = dayAppointments.length - MAX_VISIBLE;

                        return (
                            <div key={day.toString()}
                                onClick={() => { setCurrentDate(day); setView('day'); }}
                                className={cn("bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50/50 min-h-[100px] cursor-pointer", !isCurrentMonth && "bg-slate-50/30 text-slate-400")}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn("text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full", isToday ? "bg-slate-900 text-slate-50" : "text-slate-700")}>{format(day, 'd', { locale: dateLocale })}</span>
                                </div>
                                <div className="flex-1 flex flex-col gap-1 overflow-visible">
                                    {visibleAppointments.map((apt: Appointment) => (
                                        <button key={apt._id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                            className={cn("w-full text-left text-[10px] leading-tight truncate rounded px-1.5 py-1 font-medium transition-all",
                                                getStatusStyles(apt.status, 'month')
                                            )}
                                        >
                                            {format(new Date(apt.dateTime), 'h:mm a', { locale: dateLocale })} {apt.contactId?.name ? `- ${apt.contactId.name}` : ''}
                                        </button>
                                    ))}
                                    {overflowCount > 0 && (
                                        <div className="text-[10px] font-medium text-slate-500 pl-1">
                                            + {overflowCount} {t('common.more')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
        const dayAppointments = filteredAppointments.filter((apt: Appointment) =>
            isWithinInterval(new Date(apt.dateTime), { start: startOfDay(currentDate), end: endOfDay(currentDate) })
        );

        return (
            <div className="flex-1 overflow-y-auto bg-white">
                {hours.map((hour) => {
                    const timeSlotStart = setMinutes(setHours(startOfDay(currentDate), hour), 0);
                    const timeSlotEnd = setMinutes(setHours(startOfDay(currentDate), hour + 1), 0);

                    const aptsInSlot = dayAppointments.filter((apt: Appointment) => {
                        const aptDate = new Date(apt.dateTime);
                        return aptDate >= timeSlotStart && aptDate < timeSlotEnd;
                    });

                    return (
                        <div key={hour} className="flex border-b min-h-[80px]">
                            <div className="w-20 border-r p-4 text-xs font-medium text-slate-500 text-right sticky left-0 bg-white">
                                {format(timeSlotStart, 'h a', { locale: dateLocale })}
                            </div>
                            <div className="flex-1 p-2 relative">
                                {aptsInSlot.map((apt: Appointment) => {
                                    const aptDate = new Date(apt.dateTime);
                                    const aptEndDate = apt.endTime ? new Date(apt.endTime) : new Date(aptDate.getTime() + 30 * 60000);
                                    const durationMins = (aptEndDate.getTime() - aptDate.getTime()) / 60000;
                                    const heightPercent = (durationMins / 60) * 100;

                                    return (
                                        <div
                                            key={apt._id}
                                            onClick={() => setSelectedAppointment(apt)}
                                            className={cn(
                                                "absolute left-2 right-2 rounded p-2 text-sm font-medium cursor-pointer border shadow-sm transition-all hover:shadow-md z-10",
                                                getStatusStyles(apt.status, 'day')
                                            )}
                                            style={{
                                                top: `${(aptDate.getMinutes() / 60) * 100}%`,
                                                height: `${heightPercent}%`
                                            }}
                                        >
                                            <div className="flex justify-between h-full overflow-hidden">
                                                <span>{format(aptDate, 'h:mm a', { locale: dateLocale })} - {format(aptEndDate, 'h:mm a', { locale: dateLocale })} &middot; {apt.contactId?.name || 'Unknown'}</span>
                                                {apt.service && <span className="opacity-75 text-xs ml-2">{apt.service}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderYearView = () => {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        const months = eachMonthOfInterval({ start, end });

        return (
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {months.map((month) => {
                        const mStart = startOfMonth(month);
                        const mEnd = endOfMonth(month);
                        const mStartWeek = startOfWeek(mStart);
                        const mEndWeek = endOfWeek(mEnd);
                        const mDays = eachDayOfInterval({ start: mStartWeek, end: mEndWeek });

                        return (
                            <div key={month.toString()}
                                onClick={() => { setCurrentDate(month); setView('month'); }}
                                className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <h3 className="font-semibold text-center mb-2">{format(month, 'MMMM', { locale: dateLocale })}</h3>
                                <div className="grid grid-cols-7 text-[10px] text-center gap-y-1">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-slate-400">{d}</div>)}
                                    {mDays.map(d => (
                                        <div key={d.toString()} className={cn(
                                            "h-6 w-6 flex items-center justify-center rounded-full mx-auto",
                                            isSameDay(d, new Date()) ? "bg-slate-900 text-white font-bold" :
                                                !isSameMonth(d, month) ? "text-slate-200" :
                                                    getAppointmentsForDay(d).length > 0 ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600"
                                        )}>
                                            {format(d, 'd', { locale: dateLocale })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {renderHeader()}

            {view === 'month' && renderMonthView()}
            {view === 'day' && renderDayView()}
            {view === 'year' && renderYearView()}

            {/* Appointment Detail Dialog */}
            <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
                {selectedAppointment && (
                    <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden shadow-2xl border-0 rounded-2xl">
                        {/* Custom Header Area */}
                        <div className={cn(
                            "px-6 py-6 text-white bg-slate-900 relative", // Added relative for absolute positioning
                            selectedAppointment.status === 'confirmed' && "bg-emerald-600",
                            selectedAppointment.status === 'cancelled' && "bg-rose-600",
                            selectedAppointment.status === 'pending' && "bg-amber-500",
                            selectedAppointment.status === 'completed' && "bg-indigo-600"
                        )}>
                            <div className="mb-2 opacity-80 text-xs font-bold tracking-wider uppercase">{t('common.appointment')}</div>
                            <DialogTitle className="text-2xl font-bold text-white leading-tight">
                                {selectedAppointment.contactId?.name || selectedAppointment.contactId?.phoneNumber || 'Unknown Client'}
                            </DialogTitle>
                            <DialogDescription className="text-white/80 mt-1">
                                {format(new Date(selectedAppointment.dateTime), 'EEEE, MMMM do', { locale: dateLocale })}
                            </DialogDescription>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Time & Service Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('calendar.appointment_detail.time')}</label>
                                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        {format(new Date(selectedAppointment.dateTime), 'h:mm a', { locale: dateLocale })} - {selectedAppointment.endTime ? format(new Date(selectedAppointment.endTime), 'h:mm a', { locale: dateLocale }) : format(new Date(new Date(selectedAppointment.dateTime).getTime() + 30 * 60000), 'h:mm a', { locale: dateLocale })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.tabs.services.header.title')}</label>
                                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                                        <Info className="h-4 w-4 text-slate-400" />
                                        {selectedAppointment.service || 'General Consultation'}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                                <div className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{selectedAppointment.contactId?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAppointment.contactId?.phoneNumber}</p>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.status.all_status')}</label>
                                <Select
                                    value={selectedAppointment.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full bg-white border-slate-200"
                                >
                                    <option value="pending">{t('common.status.pending')}</option>
                                    <option value="confirmed">{t('common.status.confirmed')}</option>
                                    <option value="completed">{t('common.status.completed')}</option>
                                    <option value="cancelled">{t('common.status.cancelled')}</option>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>{t('common.close')}</Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
