import { useState, ChangeEvent, FormEvent } from 'react';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInputProps';
import { Divider } from '../components/Divider';
import { useLoginMutation } from '../../../apis/store/api/auth.ts';
import styles from '../login.module.scss';

// ── Types (same as before) ───────────────────────────────────────────────────

interface LoginRequest {
  identifier: string;
  password: string;
}

interface FieldError {
  identifier?: string;
  password?: string;
}

// ── Validation (unchanged) ───────────────────────────────────────────────────

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
  
  // RTK Query mutation hook
  const [login, { isLoading, error: apiErrorObj }] = useLoginMutation();

  // Helper to extract error message from RTK Query error
  const apiErrorMessage = apiErrorObj
    ? (apiErrorObj as any)?.data?.message || 'Invalid credentials. Please try again.'
    : '';

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
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

    try {
      // RTK Query mutation – unwrap() to get the actual response or throw
      const result = await login(form).unwrap();
      // Token is already stored in localStorage (if you added transformResponse)
      // But you can also manually store it here:
      // localStorage.setItem('accessToken', result.accessToken);
      // Redirect or show success message
      console.log('Login success:', result);
      // e.g. navigate('/dashboard');
    } catch (err) {
      // Error is already stored in apiErrorObj, no extra handling needed
      console.error('Login failed:', err);
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

        {apiErrorMessage && (
          <div className={styles.apiError}>
            <span>⚠</span> {apiErrorMessage}
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

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
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