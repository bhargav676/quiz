import React from 'react';
import styles from './Header.module.scss';

interface HeaderProps {
  toggleMobileSidebar: () => void;
  user: any;
}

export const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar, user }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={toggleMobileSidebar}>
        ☰
      </button>

      <div className={styles.pageTitle}>
        {user?.role === 'ADMIN'
          ? 'Admin Panel'
          : user?.role === 'INSTRUCTOR'
          ? 'Instructor Portal'
          : 'Participant Portal'}
      </div>

      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name}</div>
          <div className={styles.userEmail}>{user?.email}</div>
        </div>
        <div className={styles.avatar}>{getInitials(user?.name)}</div>
      </div>
    </header>
  );
};
