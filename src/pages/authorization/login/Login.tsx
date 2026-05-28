import { useState, ChangeEvent, FormEvent } from 'react';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInputProps';
import { Divider } from '../components/Divider';
import styles from '../login.module.scss';

// ── Types ────────────────────────────────────────────────────────────────────

interface LoginRequest {
  identifier: string;
  password: string;
}

interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

interface FieldError {
  identifier?: string;
  password?: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(form: LoginRequest): FieldError {
  const errors: FieldError = {};
  if (!form.identifier.trim()) errors.identifier = 'Username or email is required.';
  if (!form.password.trim()) errors.password = 'Password is required.';
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [form, setForm] = useState<LoginRequest>({ identifier: '', password: '' });
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginRequest, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    setApiError('');
    setSuccessMsg('');
    if (touched[name as keyof LoginRequest]) {
      setErrors(validate(updated));
    }
  }

  function handleBlur(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as keyof LoginRequest;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(form));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const allTouched = { identifier: true, password: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Invalid credentials. Please try again.');
      }

      const data: AuthResponse = await res.json();
      localStorage.setItem('token', data.token);
      setSuccessMsg(`Welcome back, ${data.username}!`);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    alert('Redirect to forgot-password flow');
  };

  const handleCreateAccount = () => {
    alert('Navigate to /register');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>💸</div>
        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your account to continue.</p>

        {apiError && (
          <div className={styles.apiError}>
            <span>⚠</span> {apiError}
          </div>
        )}
        {successMsg && (
          <div className={styles.successMessage}>
            <span>✓</span> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextInput
            id="identifier"
            name="identifier"
            label="Username or email"
            value={form.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com or john_doe"
            autoComplete="username"
            error={errors.identifier}
            touched={touched.identifier}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password}
            touched={touched.password}
            forgotPasswordLink
            onForgotPasswordClick={handleForgotPassword}
          />

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Divider />

        <p className={styles.footer}>
          Don't have an account?{' '}
          <button type="button" className={styles.link} onClick={handleCreateAccount}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}