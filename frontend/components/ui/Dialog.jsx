import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function Dialog({ 
    open, 
    onOpenChange, 
    title, 
    description, 
    children, 
    footer 
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setVisible(false), 300); // Wait for exit animation
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!visible) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className={cn(
                    "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
                    open ? "opacity-100" : "opacity-0"
                )}
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog Content */}
            <div 
                className={cn(
                    "relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 md:p-8 text-left align-middle shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out border border-white/50",
                    open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Header */}
                <div className="mb-6">
                    {title && (
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Body */}
                <div className="mt-2">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export function DialogButton({ onClick, variant = "primary", children, disabled, loading }) {
    if (variant === "secondary") {
        return (
            <Button
                variant="ghost"
                onClick={onClick}
                disabled={disabled || loading}
                className="w-full sm:w-auto font-bold text-slate-500 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-100 border border-transparent rounded-xl h-12"
            >
                {children}
            </Button>
        );
    }

    return (
        <Button
            onClick={onClick}
            disabled={disabled || loading}
            className="w-full sm:w-auto font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 rounded-xl h-12 px-6"
        >
            {loading ? "Processing..." : children}
        </Button>
    );
}
