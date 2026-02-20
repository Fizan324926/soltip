import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showClose?: boolean;
  /** Extra className applied to the content panel */
  className?: string;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.97,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Animated backdrop */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={styles.overlay}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Animated content */}
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(styles.content, styles[size], className)}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ position: 'fixed', top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
              >
                {(title || showClose) && (
                  <div className={styles.header}>
                    <div className="flex-1 min-w-0">
                      {title && (
                        <Dialog.Title className={styles.title}>{title}</Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className={styles.description}>
                          {description}
                        </Dialog.Description>
                      )}
                    </div>

                    {showClose && (
                      <Dialog.Close asChild>
                        <button className={styles.closeBtn} aria-label="Close modal">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path
                              d="M1 1L13 13M13 1L1 13"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                <div className={styles.body}>{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default Modal;
