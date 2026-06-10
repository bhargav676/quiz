import React from 'react';
import styles from './LogoutButton.module.scss';

export interface LogoutButtonProps {
  onLogout: () => void;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout, className = '' }) => {
  return (
    <button className={`${styles.logoutBtn} ${className}`} onClick={onLogout}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Sign Out</span>
    </button>
  );
};
