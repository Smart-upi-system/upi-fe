import { ChangeEvent, FocusEvent } from 'react';
import styles from '../login.module.scss';

interface TextInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  maxLength?: number;
}

export function TextInput({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '',
  type = 'text',
  autoComplete,
  error,
  touched,
  hint,
  maxLength,
}: TextInputProps) {
  const inputClassName = `${styles.input} ${touched ? (error ? styles['input--error'] : styles['input--valid']) : ''}`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          className={inputClassName}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
      {touched && error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}