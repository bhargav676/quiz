import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useThemeStore, useLogoutApiMutation } from '../store';
import { logout } from '../store/authSlice';
import { Sidebar, Header } from '../organisms';
import styles from './MainLayout.module.scss';

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { theme, setTheme } = useThemeStore();
  const [logoutApi] = useLogoutApiMutation();

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      // Fire backend logout request to clear cookie (fails silently if server is down)
      await logoutApi().unwrap();
    } catch {
      // ignore
    } finally {
      // Clear client state
      dispatch(logout());
      navigate('/login');
    }
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.show : ''}`}
        onClick={toggleMobileSidebar}
      ></div>

      {/* Sidebar Organism */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        theme={theme}
        handleToggleTheme={handleToggleTheme}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={styles.contentWrapper}>
        {/* Header Organism */}
        <Header
          toggleMobileSidebar={toggleMobileSidebar}
          user={user}
        />

        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
