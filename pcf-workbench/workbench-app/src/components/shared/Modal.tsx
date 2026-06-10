import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 500 }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -8 }}
          style={{ width }}
          className="bg-wb-bg2 border border-wb-border rounded-lg shadow-2xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-wb-border shrink-0">
            <span className="text-sm font-semibold text-wb-text">{title}</span>
            <button onClick={onClose} className="p-1 text-wb-muted hover:text-wb-text transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
