import React, { type FC } from 'react';
import { Toaster } from 'react-hot-toast';

// ============================================================
// SolTip design tokens (keep in sync with tailwind.config)
// ============================================================
const COLORS = {
  bgDark:    '#131325',
  bgSuccess: '#0d2e1a',
  bgError:   '#2e0d0d',
  textLight: '#f0f0ff',
  success:   '#14f195',  // Solana green
  error:     '#ff4d4d',
  border:    '#2a2a4a',
};

// ============================================================
// ToastProvider
//
// Renders react-hot-toast's Toaster with a dark, Solana-flavoured
// theme that matches the SolTip design language.
// ============================================================
export const ToastProvider: FC = () => {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        bottom: 24,
        right: 24,
      }}
      toastOptions={{
        // ---- Default (shared) styles ----
        duration: 5000,
        style: {
          background:   COLORS.bgDark,
          color:        COLORS.textLight,
          border:       `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          padding:      '12px 16px',
          fontSize:     '14px',
          fontFamily:   'inherit',
          maxWidth:     '420px',
          boxShadow:    '0 8px 32px rgba(0, 0, 0, 0.6)',
        },

        // ---- Success ----
        success: {
          duration: 4000,
          style: {
            background: COLORS.bgSuccess,
            border:     `1px solid ${COLORS.success}`,
          },
          iconTheme: {
            primary:    COLORS.success,
            secondary:  COLORS.bgDark,
          },
        },

        // ---- Error ----
        error: {
          duration: 7000,
          style: {
            background: COLORS.bgError,
            border:     `1px solid ${COLORS.error}`,
          },
          iconTheme: {
            primary:    COLORS.error,
            secondary:  COLORS.bgDark,
          },
        },

        // ---- Loading ----
        loading: {
          duration: Infinity,
          style: {
            background: COLORS.bgDark,
            border:     `1px solid ${COLORS.border}`,
          },
          iconTheme: {
            primary:    '#9945ff',  // Solana purple
            secondary:  COLORS.bgDark,
          },
        },
      }}
    />
  );
};

export default ToastProvider;
