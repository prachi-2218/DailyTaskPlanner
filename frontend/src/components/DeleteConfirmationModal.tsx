import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Task',
  description = 'Are you sure you want to delete this task? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Add a class to the body to prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      setMounted(true);
    }
    return () => {
      document.body.style.overflow = '';
      setMounted(false);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Blurred background */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      <div 
        className="relative z-10 w-full max-w-md overflow-hidden rounded-lg bg-white/95 shadow-xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50/95 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}