import { useState, type FormEvent } from 'react';
import { hasPassphrase, login, setPassphrase as savePassphrase } from '@/lib/auth';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const needsEnrollment = useState<boolean>(() => !hasPassphrase())[0];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your credentials.');
      return;
    }

    if (enrolling) {
      if (password.length < 4) {
        setError('Passphrase must be at least 4 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passphrases do not match.');
        return;
      }
      await savePassphrase(password);
      const user = await login(email, password);
      if (!user) {
        setError('Could not establish session.');
        return;
      }
      onLogin();
      return;
    }

    const user = await login(email, password);
    if (!user) {
      setError('Invalid credentials.');
      return;
    }
    onLogin();
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif text-white text-5xl font-bold tracking-tight">Circuitus</h1>
          <p className="text-gold text-sm tracking-[0.25em] uppercase mt-3 font-sans font-light">
            The Tech-Forward Suite for Counsel
          </p>
          <p className="text-white/40 text-xs mt-3 font-sans max-w-xs mx-auto leading-relaxed">
            Practical guidance. Transactional intelligence. Built for in-house teams.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-lg p-8"
        >
          <div className="h-[3px] bg-gold rounded-full -mt-8 mb-6 mx-[-32px] rounded-t-lg" />

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-sans uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="counsel@firm.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded px-4 py-2.5 text-white placeholder-white/25 font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-sans uppercase tracking-wider mb-1.5">
                {enrolling ? 'Set Passphrase' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={enrolling ? 'Choose a passphrase' : 'Enter your password'}
                className="w-full bg-white/[0.06] border border-white/10 rounded px-4 py-2.5 text-white placeholder-white/25 font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition-colors"
              />
            </div>

            {enrolling && (
              <div>
                <label className="block text-white/60 text-xs font-sans uppercase tracking-wider mb-1.5">
                  Confirm Passphrase
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter passphrase"
                  className="w-full bg-white/[0.06] border border-white/10 rounded px-4 py-2.5 text-white placeholder-white/25 font-sans text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition-colors"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs font-sans">{error}</p>}

            <button
              type="submit"
              className="w-full bg-navy-dark border border-gold/30 text-gold font-sans font-semibold text-sm uppercase tracking-wider py-3 rounded hover:bg-navy-light hover:border-gold/50 transition-colors mt-2"
            >
              {enrolling ? 'Enroll & Sign In' : 'Sign In'}
            </button>

            {needsEnrollment && !enrolling && (
              <button
                type="button"
                onClick={() => setEnrolling(true)}
                className="w-full text-white/40 hover:text-white/70 text-[10px] font-sans uppercase tracking-wider transition-colors"
              >
                First time on this device? Set a passphrase
              </button>
            )}
            {enrolling && (
              <button
                type="button"
                onClick={() => {
                  setEnrolling(false);
                  setConfirm('');
                  setError('');
                }}
                className="w-full text-white/40 hover:text-white/70 text-[10px] font-sans uppercase tracking-wider transition-colors"
              >
                Skip — sign in without a passphrase
              </button>
            )}
          </div>

          <p className="text-white/20 text-[10px] font-sans text-center mt-6 leading-relaxed">
            Authorized users only. Access is monitored.
          </p>
        </form>

        <p className="text-white/15 text-[10px] font-sans text-center mt-6">
          &copy; 2026 Circuitus Legal Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}
