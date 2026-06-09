import React, { useState } from 'react';
import { useAssignInstructorMutation } from '../store';
import styles from './AccessManagement.module.scss';

const AccessManagement: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [assignInstructor, { isLoading }] = useAssignInstructorMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      const res = await assignInstructor({ email }).unwrap();
      
      if (res.success) {
        if (res.data?.tempPassword) {
          setSuccessMsg(
            `Successfully created new Instructor account for ${email}. Temporary password is "${res.data.tempPassword}".`
          );
        } else {
          setSuccessMsg(`Successfully updated role of ${email} to INSTRUCTOR.`);
        }
        setEmail('');
      } else {
        setErrorMsg(res.message || 'Failed to assign role.');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || err?.message || 'Failed to update access role. Please try again.'
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1>Access Management</h1>
        <p>Assign roles and manage system permissions for instructors.</p>
      </div>

      <div className={styles.card}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Assign Instructor Role</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Enter a user's email address below to grant them Instructor privileges. If the user does not exist, a new account will be created with a temporary password.
        </p>

        {successMsg && (
          <div className={`${styles.alert} ${styles.success}`}>
            <span>✅</span>
            <div>{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className={`${styles.alert} ${styles.error}`}>
            <span>⚠️</span>
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="instructor@quizarena.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Assigning Privileges...' : 'Assign Instructor Role'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessManagement;
