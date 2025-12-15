import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
            <div className="z-50 w-full flex justify-center animate-in zoom-in-95 data-[state=open]:fade-in-0">
                {children}
            </div>
        </div>
    )
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl p-6", className)}>{children}</div>
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn("text-sm text-slate-500", className)}>{children}</p>
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
}

export function DialogClose({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </button>
    )
}
