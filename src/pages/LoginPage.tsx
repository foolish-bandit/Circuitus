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
    <div className="min-h-screen bg-paper text-ink relative overflow-hidden">
      {/* Decorative side rules — like the spine of a leather-bound volume */}
      <div className="hidden md:block absolute left-12 top-0 bottom-0 w-px bg-rule" aria-hidden />
      <div className="hidden md:block absolute right-12 top-0 bottom-0 w-px bg-rule" aria-hidden />

      <div className="min-h-screen grid md:grid-cols-[1.1fr_1fr] max-w-[1400px] mx-auto">
        {/* Left — editorial masthead */}
        <aside className="hidden md:flex flex-col justify-between p-16 lg:p-24 relative bg-paper-warm">
          <div>
            <p className="kicker-brass mb-8">
              <span className="inline-block w-8 h-px bg-brass align-middle mr-3" />
              No. CXLVII · Spring Term 2026
            </p>

            <h1 className="font-display font-semibold text-ink leading-[0.92] text-[120px] -tracking-[0.02em] mb-8">
              Circ-
              <br />
              <span className="italic font-normal text-brass">uitus</span>
            </h1>

            <div className="rule-double w-32 mb-8" />

            <p className="font-display text-[18px] leading-[1.5] text-ink-soft max-w-md">
              <span className="smcp text-ink">Practice intelligence</span> for the working
              attorney — research, drafting, and quantitative tools, integrated into a single
              private workspace and grounded in on-device computation.
            </p>
          </div>

          <div className="space-y-3 mt-12">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] text-brass-dim w-16">i.</span>
              <p className="font-serif text-[13px] text-ink-soft italic">
                Document reader with annotation, highlighting, and cross-reference.
              </p>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] text-brass-dim w-16">ii.</span>
              <p className="font-serif text-[13px] text-ink-soft italic">
                Drafting workspace with templates, redline, and case-theory diagrams.
              </p>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] text-brass-dim w-16">iii.</span>
              <p className="font-serif text-[13px] text-ink-soft italic">
                On-device intelligence — no queries leave the browser.
              </p>
            </div>
          </div>
        </aside>

        {/* Right — sign-in form */}
        <main className="flex flex-col justify-center p-10 sm:p-16 lg:p-24 relative">
          <div className="md:hidden mb-10 text-center">
            <h1 className="font-display font-semibold text-ink text-5xl leading-none mb-3">
              Circuitus
            </h1>
            <p className="kicker-brass">For Counsel · Est. 2026</p>
          </div>

          <div className="max-w-md w-full md:max-w-sm">
            <p className="kicker mb-3">Member Sign-In</p>
            <h2 className="font-display text-3xl font-semibold text-ink leading-tight mb-2">
              Welcome back, counselor.
            </h2>
            <p className="font-serif text-[14px] italic text-ink-muted mb-10 leading-relaxed">
              Authorized members only. All session activity is recorded locally.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="kicker block mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@firm.com"
                  className="w-full bg-transparent border-0 border-b border-rule focus:border-brass focus:outline-none px-0 py-2 font-serif text-[15px] text-ink placeholder-ink-muted/40 transition-colors"
                />
              </div>

              <div>
                <label className="kicker block mb-2">
                  {enrolling ? 'Set Passphrase' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={enrolling ? 'Choose a passphrase' : 'Enter your password'}
                  className="w-full bg-transparent border-0 border-b border-rule focus:border-brass focus:outline-none px-0 py-2 font-serif text-[15px] text-ink placeholder-ink-muted/40 transition-colors"
                />
              </div>

              {enrolling && (
                <div>
                  <label className="kicker block mb-2">Confirm Passphrase</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter passphrase"
                    className="w-full bg-transparent border-0 border-b border-rule focus:border-brass focus:outline-none px-0 py-2 font-serif text-[15px] text-ink placeholder-ink-muted/40 transition-colors"
                  />
                </div>
              )}

              {error && (
                <p className="font-sans text-[12px] text-claret leading-relaxed">
                  <span className="smcp">Notice —</span> {error}
                </p>
              )}

              <button
                type="submit"
                className="group w-full bg-navy text-paper hover:bg-navy-dark transition-colors font-sans text-[11px] uppercase tracking-marque font-medium py-3.5 mt-4 relative"
                style={{
                  borderRadius: 0,
                  border: '1px solid #0A1F3D',
                  boxShadow: 'inset 0 0 0 1px rgba(184, 147, 43, 0.25)',
                }}
              >
                <span className="text-brass-bright mr-3" aria-hidden>
                  ⁂
                </span>
                {enrolling ? 'Enroll & Enter Chambers' : 'Enter Chambers'}
                <span className="text-brass-bright ml-3" aria-hidden>
                  ⁂
                </span>
              </button>

              {needsEnrollment && !enrolling && (
                <button
                  type="button"
                  onClick={() => setEnrolling(true)}
                  className="w-full kicker text-ink-muted hover:text-brass transition-colors pt-2"
                >
                  First time on this device? Set a passphrase →
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
                  className="w-full kicker text-ink-muted hover:text-brass transition-colors pt-2"
                >
                  Skip — proceed without a passphrase
                </button>
              )}
            </form>

            <div className="mt-12 pt-6 border-t border-rule-faint">
              <p className="font-mono text-[10px] text-ink-muted/70 leading-relaxed">
                <span className="text-brass">§</span> By entering, you affirm that all data
                processed in this session remains on this device. No content is transmitted
                to Circuitus or any third party.
              </p>
            </div>
          </div>

          <footer className="absolute bottom-8 right-10 sm:right-16 lg:right-24">
            <p className="font-mono text-[9px] text-ink-muted/50 tracking-marque">
              © MMXXVI · Circuitus Legal Technologies
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
