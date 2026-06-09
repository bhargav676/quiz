import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation, useAppDispatch, useAppSelector } from '../store';
import { setCredentials } from '../store/authSlice';
import styles from './Register.module.scss';
import { Role } from '../types';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);

  // Password validation logic for the checklist
  const validation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      const paths = {
        [Role.PARTICIPANT]: '/participant/dashboard',
        [Role.ADMIN]: '/admin/dashboard',
        [Role.INSTRUCTOR]: '/instructor/dashboard',
      };
      navigate(paths[user.role as Role] || '/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!Object.values(validation).every(Boolean)) {
      setErrorMsg('Please meet all password requirements.');
      return;
    }

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: Role.PARTICIPANT,
      }).unwrap();

      if (res.success && res.data) {
        dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainLayout}>
        {/* LEFT SIDE: FORM */}
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
            <button type="button" onClick={() => navigate('/login')}>Sign In</button>
            <button type="button" className={styles.activeTab}>Sign Up</button>
          </div>

          <div className={styles.header}>
            <h1>Create your account</h1>
            <p>Join QuizArena and start your journey</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Aryan Kumar" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

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
                placeholder="Aryan@12" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className={styles.checklist}>
              <div className={validation.length ? styles.valid : ''}>
                <span>{validation.length ? '✓' : '○'}</span> At least 8 characters
              </div>
              <div className={validation.uppercase ? styles.valid : ''}>
                <span>{validation.uppercase ? '✓' : '○'}</span> One uppercase letter (A-Z)
              </div>
              <div className={validation.lowercase ? styles.valid : ''}>
                <span>{validation.lowercase ? '✓' : '○'}</span> One lowercase letter (a-z)
              </div>
              <div className={validation.number ? styles.valid : ''}>
                <span>{validation.number ? '✓' : '○'}</span> One number (0-9)
              </div>
              <div className={validation.symbol ? styles.valid : ''}>
                <span>{validation.symbol ? '✓' : '○'}</span> One symbol (!@#$...)
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        {/* RIGHT SIDE: INFO */}
        <div className={styles.infoSection}>
          <div className={styles.circles}>
             <div className={styles.c1}></div>
             <div className={styles.c2}></div>
          </div>
          <div className={styles.infoContent}>
            <div className={styles.userIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
              </svg>
            </div>
            <h2>Your account, <br/> your progress</h2>
            <p>All your quizzes, scores, and analytics — saved and accessible anytime.</p>
            
            <div className={styles.featureList}>
              <div className={styles.fItem}>📄 Access your assigned quizzes</div>
              <div className={styles.fItem}>📈 Track your scores over time</div>
              <div className={styles.fItem}>🖋️ Detailed per-question review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;