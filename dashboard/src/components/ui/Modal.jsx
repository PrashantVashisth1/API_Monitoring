/**
 * Modal.jsx — Reusable accessible modal component.
 *
 * Features:
 *  - Renders into document.body via ReactDOM.createPortal
 *  - Locks body scroll when open
 *  - Escape key closes the modal
 *  - Backdrop click closes the modal
 *  - Animates in with fade-in-scale (defined in tailwind.config.js)
 *  - Fully accessible: role="dialog", aria-modal, aria-labelledby
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="My Modal">
 *     <p>Content here</p>
 *   </Modal>
 *
 *  `title` is optional. If omitted, no header bar is rendered and the
 *  caller is responsible for adding their own heading inside children.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    // ── Keyboard and scroll management ────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            {/* ── Backdrop ─────────────────────────────────────────────────── */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* ── Panel ────────────────────────────────────────────────────── */}
            <div
                className={[
                    'relative z-10 w-full',
                    maxWidth,
                    'bg-[#0f0f12] border border-zinc-700/80 rounded-2xl',
                    'shadow-2xl shadow-black/70',
                    'animate-fade-in-scale',
                ].join(' ')}
            >
                {/* ── Optional header ──────────────────────────────────────── */}
                {title && (
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                        <h2
                            id="modal-title"
                            className="text-sm font-semibold text-zinc-100"
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close modal"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
                        >
                            <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                )}

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className={title ? 'px-6 pb-6' : 'p-6'}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
