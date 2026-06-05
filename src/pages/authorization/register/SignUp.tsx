import { useState, ChangeEvent, FormEvent, useCallback } from "react";
import { Divider } from "../components/Divider";
import { PasswordInput } from "../components/PasswordInputProps";
import { TextInput } from "../components/TextInput";
import styles from "../login.module.scss";
import { useRegisterMutation } from "../../../apis/store/api/auth.ts";
import { useNavigate } from "react-router-dom";

interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
}

// interface AuthResponse {
//   token: string;
//   username: string;
//   email: string;
//   accessToken?: string;   // added
//   refreshToken?: string;  // added
// }

type FieldErrors = Partial<Record<keyof RegisterRequest, string>>;

// ── Validation ───────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validate(form: RegisterRequest): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.username.trim()) {
    errors.username = 'Username is required.';
  } else if (form.username.length < 3 || form.username.length > 50) {
    errors.username = 'Username must be between 3 and 50 characters.';
  } else if (!USERNAME_RE.test(form.username)) {
    errors.username = 'Only letters, numbers, dots, underscores, and hyphens allowed.';
  }

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.length < 2 || form.name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  } else if (form.email.length > 100) {
    errors.email = 'Email cannot exceed 100 characters.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8 || form.password.length > 100) {
    errors.password = 'Password must be between 8 and 100 characters.';
  } else if (!PASSWORD_RE.test(form.password)) {
    errors.password =
      'Must contain uppercase, lowercase, a digit, and a special character (@$!%*?&).';
  }

  return errors;
}

// ── Password strength ─────────────────────────────────────────────────────────

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: '#e0e0e0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: '#ef4444' },
    2: { label: 'Fair', color: '#f97316' },
    3: { label: 'Good', color: '#eab308' },
    4: { label: 'Strong', color: '#22c55e' },
  };
  return { score, ...(map[score] ?? { label: '', color: '#e0e0e0' }) };
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM: RegisterRequest = { username: '', name: '', email: '', password: '' };

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterRequest, boolean>>>({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
   const navigate = useNavigate();

  // ── Navigation helpers ──
  const navigateToTransaction = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate("/transaction", { replace: true });
    } else {
      console.warn('No token found. Cannot navigate to transaction.');
    }
  }, [navigate]);

  const navigateToLogin = useCallback(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  const strength = getPasswordStrength(form.password);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name as keyof RegisterRequest]) {
      setErrors(validate(updated));
    }
  }

  function handleBlur(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as keyof RegisterRequest;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(form));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ username: true, name: true, email: true, password: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError('');
    setSuccessMsg('');

    try {
      const result = await register(form).unwrap();
      setSuccessMsg(`Account created! Welcome, ${result.username ?? 'User'} 🎉`);
      setForm(EMPTY_FORM);
      setTouched({});
      // Navigate to transaction if token was stored, otherwise to login
      setTimeout(() => {
        navigateToTransaction();
      }, 1500);
    } catch (err: unknown) {
      // Read the error message directly from the thrown RTK Query error
      const errorMessage =
        (err as any)?.data?.message ?? // server-side message
        (err instanceof Error ? err.message : 'Something went wrong.');
      setApiError(errorMessage);
      console.error('Registration failed:', err);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>💸</div>
        <h1 className={styles.heading}>Create an account</h1>
        <p className={styles.subheading}>Join us — it only takes a minute.</p>

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
          <div className={styles.row}>
            <TextInput
              id="username"
              name="username"
              label="Username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="john_doe"
              autoComplete="username"
              error={errors.username}
              touched={touched.username}
              hint="3–50 chars · letters, numbers, . _ -"
              maxLength={50}
            />
            <TextInput
              id="name"
              name="name"
              label="Full name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="John Doe"
              autoComplete="name"
              error={errors.name}
              touched={touched.name}
              maxLength={100}
            />
          </div>

          <TextInput
            id="email"
            name="email"
            label="Email address"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            touched={touched.email}
            maxLength={100}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password}
            touched={touched.password}
            hint="8+ chars · uppercase, lowercase, digit, special (@$!%*?&)"
            strength={strength}
          />

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <Divider />

        <p className={styles.footer}>
          Already have an account?{' '}
          <button type="button" className={styles.link} onClick={() => navigateToLogin()}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}