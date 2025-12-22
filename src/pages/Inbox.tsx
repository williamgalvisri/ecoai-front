import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContacts, toggleBot, sendMessage, getChatHistory, type Contact } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Skeleton } from '../components/ui/skeleton';
import { Search, Send, User, Bot, Clock, Check, CheckCheck, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useSSE } from '../hooks/useSSE';
import { useTranslation } from 'react-i18next';

interface Message {
    _id: string;
    role: 'user' | 'assistant' | 'owner';
    content: string;
    timestamp: string;
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export default function Inbox() {
    const { t } = useTranslation();
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ['contacts'],
        queryFn: getContacts,
    });

    // Fetch History when Contact Selected
    useEffect(() => {
        if (selectedContact) {
            setMessages([]); // Clear previous
            setIsHistoryLoading(true);
            setHasMore(false);

            getChatHistory(selectedContact._id, { limit: 20 }).then(history => {
                // Assume history messages are at least 'sent' if not specified
                const processedHistory = history.map((msg: Message) => ({
                    ...msg,
                    status: msg.status || 'sent' // Default to sent for history
                }));
                // Sort by timestamp just in case
                processedHistory.sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                setMessages(processedHistory);
                setHasMore(history.length === 20); // If we got full limit, likely more exist
                setIsHistoryLoading(false);
                scrollToBottom(true); // Instant scroll on load
            });
        }
    }, [selectedContact]);

    const loadMoreMessages = async () => {
        if (!selectedContact || messages.length === 0 || isLoadingMore) return;

        setIsLoadingMore(true);
        const oldestMessage = messages[0];

        try {
            const olderMessages = await getChatHistory(selectedContact._id, {
                limit: 20,
                before: oldestMessage.timestamp
            });

            if (olderMessages.length > 0) {
                const processedOlder = olderMessages.map((msg: Message) => ({
                    ...msg,
                    status: msg.status || 'sent'
                }));
                processedOlder.sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                // Capture current scroll height before adding messages
                const container = chatContainerRef.current;
                const oldScrollHeight = container?.scrollHeight || 0;
                const oldScrollTop = container?.scrollTop || 0;

                setMessages(prev => [...processedOlder, ...prev]);
                setHasMore(olderMessages.length === 20);

                // Restore scroll position after render
                requestAnimationFrame(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
                    }
                });
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more messages", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const scrollToBottom = (instant = false) => {
        if (instant) {
            // Instant jump (no animation)
            // Need a slight delay to allow rendering, but 'auto' behavior helps
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "auto" });
                }
            }, 50);
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Auto-scroll on new messages logic is handled manually in handlers or SSE for control

    // Real-time updates
    const deviceId = useMemo(() => {
        let id = localStorage.getItem('chat_device_id');
        if (!id) {
            id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('chat_device_id', id);
        }
        return id;
    }, []);

    useSSE(`${import.meta.env.VITE_API_URL}/api/events?sessionId=${deviceId}`, (event) => {
        try {
            if (event.type === 'NEW_MESSAGE') {
                const data = JSON.parse(event.data);
                // If the message belongs to the currently selected contact
                if (selectedContact && (data.contactId === selectedContact._id || data.phoneNumber === selectedContact.phoneNumber)) {
                    setMessages(prev => {
                        // Check if we have a pending message with the same content (deduplication)
                        const pendingMatchIndex = prev.findIndex(m =>
                            m.status === 'pending' &&
                            m.content === data.content &&
                            m.role === data.role
                        );

                        if (pendingMatchIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[pendingMatchIndex] = {
                                ...data,
                                status: 'sent',
                                _id: data._id
                            };
                            return newMessages;
                        }

                        const exists = prev.some(m => m._id === data._id);
                        if (exists) return prev;

                        // It's a brand new message, scroll to bottom
                        setTimeout(() => scrollToBottom(false), 100);

                        return [...prev, {
                            _id: data._id || Date.now().toString(),
                            role: data.role,
                            content: data.content,
                            timestamp: data.timestamp || new Date().toISOString(),
                            status: 'sent'
                        }];
                    });
                }
                // Refresh contacts list to update lastInteraction/sorting
                queryClient.invalidateQueries({ queryKey: ['contacts'] });
            } else if (event.type === 'MESSAGE_STATUS_UPDATE') {
                const data = JSON.parse(event.data);
                setMessages(prev => prev.map(msg =>
                    msg._id === data.messageId ? { ...msg, status: data.status } : msg
                ));
            }
        } catch (error) {
            console.error("Error parsing SSE message:", error);
        }
    });

    const toggleBotMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleBot(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            if (selectedContact) {
                setSelectedContact(prev => prev ? { ...prev, isBotActive: !prev.isBotActive } : null);
            }
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: ({ phoneNumber, message }: { phoneNumber: string; message: string }) => sendMessage(phoneNumber, message),
        onMutate: async ({ phoneNumber, message }) => {
            await queryClient.cancelQueries({ queryKey: ['chat', phoneNumber] });

            const previousMessages = messages;

            const optimisticMessage: Message = {
                _id: `temp-${Date.now()}`,
                role: 'owner',
                content: message,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            setMessages((old) => [...old, optimisticMessage]);
            setMessageInput('');
            scrollToBottom();

            return { previousMessages, tempId: optimisticMessage._id };
        },
        onSuccess: (data, _variables, context) => {
            setMessages((old) => {
                if (!Array.isArray(old)) return [];

                const realIdExists = old.some(m => m._id === data._id);
                if (realIdExists) return old;

                return old.map(msg =>
                    msg._id === context?.tempId
                        ? { ...msg, _id: data._id || msg._id, status: 'sent', timestamp: data.timestamp || msg.timestamp }
                        : msg
                );
            });
        },
        onError: (_err, _variables, context) => {
            setMessages((old) => old.map(msg =>
                msg._id === context?.tempId
                    ? { ...msg, status: 'failed' }
                    : msg
            ));
        },
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact || !messageInput.trim()) return;
        sendMessageMutation.mutate({ phoneNumber: selectedContact.phoneNumber, message: messageInput });
    };

    const renderStatusIcon = (msg: Message) => {
        if (msg.role !== 'owner') return null;

        const iconClass = "h-3 w-3 ml-1";
        switch (msg.status) {
            case 'pending':
                return <Clock className={cn(iconClass, "text-slate-400")} />;
            case 'sent':
                return <Check className={cn(iconClass, "text-slate-400")} />;
            case 'delivered':
                return <CheckCheck className={cn(iconClass, "text-slate-400")} />;
            case 'read':
                return <CheckCheck className={cn(iconClass, "text-blue-500")} />;
            case 'failed':
                return <span className="ml-1 text-red-500 text-[10px] font-bold">!</span>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full bg-white font-sans">
            {/* Contact List */}
            <div className={cn(
                "w-full md:w-80 border-r flex flex-col bg-slate-50 border-slate-200",
                selectedContact ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={t('inbox.search_placeholder')}
                            className="pl-9 bg-slate-100 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-8 flex justify-center text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        contacts.map((contact: Contact) => (
                            <div
                                key={contact._id}
                                onClick={() => setSelectedContact(contact)}
                                className={cn(
                                    "p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-100 active:bg-slate-200",
                                    selectedContact?._id === contact._id
                                        ? "bg-white border-l-4 border-l-emerald-500 shadow-sm"
                                        : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "font-semibold truncate",
                                        selectedContact?._id === contact._id ? "text-slate-900" : "text-slate-700"
                                    )}>
                                        {contact.name || contact.phoneNumber}
                                    </span>
                                    {contact.lastInteraction && (
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {format(new Date(contact.lastInteraction), 'h:mm a')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 truncate block max-w-[120px]">
                                        {contact.phoneNumber}
                                    </span>
                                    {contact.isBotActive && (
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                            <Bot className="w-3 h-3" /> Bot
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-[#e5ddd5] relative",
                !selectedContact ? "hidden md:flex" : "flex"
            )}>
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://camo.githubusercontent.com/854a93c27d64274c4f8f5a0b6ec36ee1d053cfcd934eac6c63bed9eaef9764bd/68747470733a2f2f7765622e77686174736170702e636f6d2f696d672f62672d636861742d74696c652d6461726b5f61346265353132653731393562366237333364393131306234303866303735642e706e67')] [background-size:400px]" />

                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b bg-white px-2 sm:px-4 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2"
                                    onClick={() => setSelectedContact(null)}
                                >
                                    <ChevronLeft className="h-5 w-5 text-slate-600" />
                                </Button>
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <h2 className="font-bold text-slate-900 leading-tight truncate max-w-[120px] sm:max-w-xs">{selectedContact.name || selectedContact.phoneNumber}</h2>
                                    <p className="text-xs text-slate-500 truncate">
                                        {selectedContact.isBotActive ? t('inbox.status.bot_active') : t('inbox.status.online')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="hidden sm:inline text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {selectedContact.isBotActive ? t('inbox.mode.ai') : t('inbox.mode.manual')}
                                </span>
                                <Switch
                                    checked={selectedContact.isBotActive}
                                    onCheckedChange={(checked) => toggleBotMutation.mutate({ id: selectedContact._id, isActive: checked })}
                                    className="data-[state=checked]:bg-emerald-500 shrink-0"
                                />
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 z-0"
                            ref={chatContainerRef}
                        >
                            {isHistoryLoading ? (
                                // Skeleton Loader
                                <div className="space-y-4 pt-4">
                                    <div className="flex w-full justify-start">
                                        <Skeleton className="h-12 w-[60%] rounded-lg rounded-tl-none bg-slate-200" />
                                    </div>
                                    <div className="flex w-full justify-end">
                                        <Skeleton className="h-12 w-[40%] rounded-lg rounded-tr-none bg-emerald-100/50" />
                                    </div>
                                    <div className="flex w-full justify-start">
                                        <Skeleton className="h-16 w-[70%] rounded-lg rounded-tl-none bg-slate-200" />
                                    </div>
                                    <div className="flex w-full justify-end">
                                        <Skeleton className="h-10 w-[30%] rounded-lg rounded-tr-none bg-emerald-100/50" />
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="bg-white/80 p-4 rounded-full mb-3 shadow-sm">
                                        <Bot className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="font-medium">{t('inbox.no_messages.title')}</p>
                                    <p className="text-sm">{t('inbox.no_messages.subtitle')}</p>
                                </div>
                            ) : (
                                <>
                                    {hasMore && (
                                        <div className="flex justify-center py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={loadMoreMessages}
                                                disabled={isLoadingMore}
                                                className="text-slate-400 hover:text-slate-600 text-xs"
                                            >
                                                {isLoadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                {t('inbox.load_more')}
                                            </Button>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => {
                                        const isOutbound = msg.role === 'owner' || msg.role === 'assistant';

                                        return (
                                            <div key={idx} className={cn("flex w-full mb-1", isOutbound ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "relative max-w-[85%] sm:max-w-[65%] px-3 py-2 text-sm shadow-sm",
                                                    isOutbound
                                                        ? "bg-[#dcf8c6] text-slate-900 rounded-lg rounded-tr-none"
                                                        : "bg-white text-slate-900 rounded-lg rounded-tl-none"
                                                )}>
                                                    {msg.role === 'assistant' && (
                                                        <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">{t('inbox.role.ai')}</span>
                                                    )}

                                                    <p className="leading-relaxed whitespace-pre-wrap pr-6">{msg.content}</p>

                                                    <div className="flex items-center justify-end gap-1 mt-1 -mb-1 select-none">
                                                        <span className="text-[10px] text-slate-500/80">
                                                            {format(new Date(msg.timestamp), 'h:mm a')}
                                                        </span>
                                                        {isOutbound && renderStatusIcon(msg)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-[#f0f2f5] border-t border-slate-200 z-10 w-full">
                            {selectedContact.isBotActive && (
                                <div className="mb-2 bg-blue-100/50 text-blue-800 px-3 py-2 rounded-md text-xs flex items-center justify-center gap-2 border border-blue-200/50">
                                    <Bot className="h-3 w-3" />
                                    <span>{t('inbox.ai_active_warning')}</span>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                <Input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={selectedContact.isBotActive ? t('inbox.input.bot_typing') : t('inbox.input.placeholder')}
                                    className="flex-1 bg-white border-none focus-visible:ring-0 rounded-lg py-3 sm:py-6 shadow-sm disabled:opacity-70 text-sm sm:text-base h-auto"
                                    disabled={selectedContact.isBotActive}
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 shadow-sm transition-all",
                                        !messageInput.trim() ? "bg-slate-200 text-slate-400 hover:bg-slate-200" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    )}
                                    disabled={selectedContact.isBotActive || !messageInput.trim()}
                                >
                                    <Send className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="h-full hidden md:flex flex-col items-center justify-center text-slate-400 bg-[#f0f2f5] border-b-[6px] border-emerald-500">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-light text-slate-600">{t('inbox.empty_state.title')}</h1>
                            <p className="text-sm">{t('inbox.empty_state.subtitle')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
