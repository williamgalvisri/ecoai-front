import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './../ui/button';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
                {/* Mobile Header Trigger */}
                <div className="md:hidden p-4 bg-white border-b flex items-center justify-between shrink-0">
                    <div className="font-bold text-slate-900">Eco AI</div>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
