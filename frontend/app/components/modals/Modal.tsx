'use client';

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
    label: string;
    close: () => void;
    content: React.ReactElement;
    isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({ label, close, content, isOpen }) => {
    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        setShowModal(isOpen);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setShowModal(false);
        setTimeout(() => {
            close();
        }, 500);
    }, [close]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with stronger blur */}
            <div 
                className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
                    showModal ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />
            
            {/* Modal Container */}
            <div className={`relative w-full max-w-3xl transition-all duration-500 ease-out ${
                showModal 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-60'
            }`}>
                <div className="bg-slate-950 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden shadow-black/50">
                    {/* Header */}
                    <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-900/50">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {label}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;