import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge, LogoutButton, ThemeToggle } from '../atoms';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  user: any;
  theme: string;
  handleToggleTheme: () => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  user,
  theme,
  handleToggleTheme,
  handleLogout,
}) => {
  return (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>QuizArena</h2>
        <Badge variant="neutral" className={styles.roleBadge}>{user?.role}</Badge>
      </div>

      <nav className={styles.sidebarNav}>
        {user?.role === 'ADMIN' ? (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/quizzes/create"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Create Quiz</span>
            </NavLink>

            <NavLink
              to="/admin/access"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              <span>Access Control</span>
            </NavLink>
          </>
        ) : user?.role === 'INSTRUCTOR' ? (
          <>
            <NavLink
              to="/instructor/dashboard"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="4"></line></svg>
              <span>Dashboard</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/participant/dashboard"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Dashboard</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
        <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        <LogoutButton onLogout={handleLogout} />
      </div>
    </aside>
  );
};
