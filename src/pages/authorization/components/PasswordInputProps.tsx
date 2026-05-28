import { ChangeEvent, FocusEvent, useState } from 'react';
import styles from '../login.module.scss';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  touched?: boolean;
  forgotPasswordLink?: boolean;
  onForgotPasswordClick?: () => void;
  hint?: string;               // additional hint text (e.g., requirements)
  strength?: PasswordStrength; // optional strength meter data
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  error,
  touched,
  forgotPasswordLink = false,
  onForgotPasswordClick,
  hint,
  strength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputClassName = `${styles.input} ${styles.inputPassword} ${touched ? (error ? styles['input--error'] : styles['input--valid']) : ''}`;

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {forgotPasswordLink && (
          <button type="button" className={styles.forgotLink} onClick={onForgotPasswordClick}>
            Forgot password?
          </button>
        )}
      </div>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClassName}
        />
        <button
          type="button"
          className={styles.eyeButton}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Strength meter */}
      {strength && value.length > 0 && (
        <>
          <div className={styles.strengthBar}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={styles.strengthSegment}
                style={{
                  background: i <= strength.score ? strength.color : '#e8e8e8',
                }}
              />
            ))}
          </div>
          <span className={styles.strengthLabel} style={{ color: strength.color }}>
            {strength.label}
          </span>
        </>
      )}

      {/* Hint */}
      {hint && <span className={styles.hint}>{hint}</span>}

      {/* Error message */}
      {touched && error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}