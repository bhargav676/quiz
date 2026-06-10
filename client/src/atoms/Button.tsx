import React from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const buttonClass = `${styles.btn} ${styles[variant]} ${styles[size]} ${
    fullWidth ? styles.fullWidth : ''
  } ${className}`;

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};
