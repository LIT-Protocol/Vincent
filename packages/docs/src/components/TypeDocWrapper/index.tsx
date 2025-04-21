import React from 'react';
import styles from './styles.module.css';

export default function TypeDocWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.typeDocWrapper}>
      {children}
    </div>
  );
} 