import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLoginMutation, useAppDispatch, useAppSelector } from '../store';
import { setCredentials } from '../store/authSlice';
import styles from './Login.module.scss';
import { Role } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { user } = useAppSelector((state) => state.auth);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === Role.ADMIN) return '/admin/dashboard';
    if (user.role === Role.INSTRUCTOR) return '/instructor/dashboard';
    return '/participant/dashboard';
  };

  const from = (location.state as any)?.from?.pathname || getDashboardPath();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await login({ email, password }).unwrap();
      if (res.success && res.data) {
        dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainLayout}>
        {/* LEFT SIDE - FORM */}
        <div className={styles.formSection}>
          <div className={styles.brand}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className={styles.brandName}>QuizArena</span>
          </div>

          <div className={styles.tabs}>
            <button type="button" className={styles.activeTab}>Sign In</button>
            <button type="button" onClick={() => navigate('/register')}>Sign Up</button>
          </div>

          <div className={styles.header}>
            <h1>Welcome back</h1>
            <p>Sign in to access your quizzes</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errorMsg && <div className={styles.errorBanner}>⚠️ {errorMsg}</div>}

            <div className={styles.inputGroup}>
              <label>Email address</label>
              <input 
                type="email" 
                placeholder="aryan@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className={styles.footer}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>

        {/* RIGHT SIDE - INFO PANEL */}
        <div className={styles.infoSection}>
          <div className={styles.circles}>
             <div className={styles.c1}></div>
             <div className={styles.c2}></div>
          </div>
          <div className={styles.infoContent}>
            <div className={styles.featureIconMain}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" opacity="0.6" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" opacity="0.8" />
              </svg>
            </div>
            <h2>Test your knowledge, <br/> track your growth</h2>
            <p>Timed quizzes, instant results, and detailed analytics — all in one place.</p>
            
            <div className={styles.featureList}>
              <div className={styles.fItem}>🕒 Timed quizzes with auto-submit</div>
              <div className={styles.fItem}>📈 Instant scores & detailed reports</div>
              <div className={styles.fItem}>📊 Personal analytics dashboard</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;