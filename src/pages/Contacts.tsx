import { useQuery } from '@tanstack/react-query';
import { getContacts, type Contact } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function ContactsPage() {
    const { t } = useTranslation();
    const { data: contacts = [] } = useQuery({
        queryKey: ['contacts'],
        queryFn: getContacts,
    });

    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('contacts.header.title')}</h1>
                <p className="text-slate-500 mt-2">{t('contacts.header.subtitle')}</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t('contacts.table.contacts.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50">
                                    <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('contacts.table.contacts.headers.name')}</th>
                                    <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('contacts.table.contacts.headers.phone')}</th>
                                    <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('contacts.table.contacts.headers.status')}</th>
                                    <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('contacts.table.contacts.headers.lastActive')}</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {contacts.map((contact: Contact) => (
                                    <tr key={contact._id} className="border-b transition-colors hover:bg-slate-50/50">
                                        <td className="p-4 align-middle font-medium">{contact.name || '-'}</td>
                                        <td className="p-4 align-middle">{contact.phoneNumber}</td>
                                        <td className="p-4 align-middle">
                                            {contact.isBotActive ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">AI Assistant</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500 border-slate-300">Manual Mode</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
