"use client"
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
} as const

const modal = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
} as const

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
    const [open, setOpen] = useState<boolean>(true);

    useEffect(() => {
        if (!open && onClose) {
            const timer = setTimeout(onClose, 250) // ⏱ exit duration
            return () => clearTimeout(timer)
        }
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={() => setOpen(false)}
                >
                    <div className="flex min-h-dvh items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
                        <motion.div
                            variants={modal}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="my-6 max-w-5xl md:min-w-fit md:max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
                        >
                            <div className="max-h-[90dvh] overflow-y-auto">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence >
    );
};

export default Modal;