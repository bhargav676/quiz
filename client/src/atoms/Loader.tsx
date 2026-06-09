import React from 'react';
import styles from './Loader.module.scss';

interface LoaderProps {
  message?: string;
  height?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Loading...', height = '50vh' }) => {
  return (
    <div className={styles.loaderContainer} style={{ height }}>
      <div className={styles.spinner}></div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};
