import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const onMove = (e: MouseEvent) => {
      setMouse({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060911;
          font-family: 'Manrope', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── BACKGROUND ── */
        .bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: pulse ease-in-out infinite alternate;
        }
        .b1 {
          width: 640px; height: 640px;
          background: radial-gradient(circle, #0d9488 0%, transparent 70%);
          top: -180px; left: -120px;
          animation-duration: 10s;
        }
        .b2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
          bottom: -120px; right: -80px;
          animation-duration: 13s;
          animation-delay: -5s;
        }
        .b3 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, #0284c7 0%, transparent 70%);
          top: 55%; left: 55%;
          animation-duration: 9s;
          animation-delay: -3s;
          opacity: 0.3;
        }
        @keyframes pulse {
          from { transform: scale(1) translate(0,0); }
          to   { transform: scale(1.1) translate(20px, -20px); }
        }

        .grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── CARD ── */
        .card {
          position: relative;
          z-index: 10;
          width: 420px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 48px 44px;
          backdrop-filter: blur(48px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 32px 80px rgba(0,0,0,0.55),
            0 0 60px rgba(13,148,136,0.07);
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)'};
          transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1);
        }

        /* top highlight line */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(13,148,136,0.8) 40%, rgba(99,102,241,1) 60%, transparent);
          border-radius: 1px;
          animation: glow 3s ease-in-out infinite;
        }
        @keyframes glow {
          0%,100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }

        /* ── LOGO ROW ── */
        .logo-row {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 40px;
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0)' : 'translateY(14px)'};
          transition: all 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s;
        }

        .logo-box {
          width: 44px; height: 44px;
          border-radius: 13px;
          background: linear-gradient(135deg, #0d9488, #0ea5e9 55%, #6366f1);
          display: grid;
          place-items: center;
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 0 22px rgba(13,148,136,0.45), 0 0 44px rgba(13,148,136,0.15);
          animation: logoGlow 3.5s ease-in-out infinite;
        }
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 0 22px rgba(13,148,136,0.45), 0 0 44px rgba(13,148,136,0.15); }
          50%      { box-shadow: 0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2); }
        }

        .logo-name {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .logo-tag {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          font-weight: 500;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        /* ── HEADING ── */
        .heading-wrap {
          margin-bottom: 32px;
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0)' : 'translateY(14px)'};
          transition: all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s;
        }

        .heading {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 7px;
        }

        .heading .hl {
          background: linear-gradient(90deg, #2dd4bf, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sub {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
          line-height: 1.5;
        }

        /* ── FORM ── */
        .form-wrap {
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0)' : 'translateY(14px)'};
          transition: all 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s;
        }

        .field { margin-bottom: 16px; }

        .lbl {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.28);
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .field:focus-within .lbl { color: rgba(45,212,191,0.85); }

        .inp-row { position: relative; }

        .ico {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.18);
          display: flex;
          pointer-events: none;
          transition: color 0.2s;
        }
        .field:focus-within .ico { color: rgba(45,212,191,0.65); }

        .inp {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 13px 14px 13px 44px;
          font-size: 14px;
          font-family: 'Manrope', sans-serif;
          font-weight: 500;
          color: #fff;
          outline: none;
          transition: all 0.22s ease;
        }
        .inp::placeholder { color: rgba(255,255,255,0.16); font-weight: 400; }
        .inp:focus {
          background: rgba(13,148,136,0.07);
          border-color: rgba(45,212,191,0.4);
          box-shadow: 0 0 0 3px rgba(45,212,191,0.09);
        }
        .inp:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #090d17 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        .inp-r { padding-right: 46px; }

        .eye {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,0.2);
          cursor: pointer; padding: 4px;
          display: flex;
          transition: color 0.2s;
        }
        .eye:hover { color: rgba(255,255,255,0.5); }

        /* ── ERROR ── */
        .err {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(244,63,94,0.07);
          border: 1px solid rgba(244,63,94,0.18);
          border-radius: 12px;
          padding: 11px 13px;
          margin-bottom: 16px;
          font-size: 12.5px;
          color: #fda4af;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-6px); }
          75%     { transform: translateX(6px); }
        }

        /* ── BUTTON ── */
        .btn {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          border: none;
          border-radius: 14px;
          font-family: 'Manrope', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          background: linear-gradient(115deg, #0d9488, #0ea5e9 45%, #6366f1);
          box-shadow: 0 4px 24px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
          letter-spacing: 0.02em;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.12);
          box-shadow: 0 10px 36px rgba(13,148,136,0.42), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn::after {
          content: '';
          position: absolute;
          top: 0; left: -130%; width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
          animation: sweep 2.8s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { left: -130%; }
          40%,100% { left: 140%; }
        }

        .btn-in {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .arr { transition: transform 0.2s; }
        .btn:hover:not(:disabled) .arr { transform: translateX(3px); }

        /* ── FOOTER ── */
        .foot {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.7s 0.45s;
        }
        .foot-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .foot-txt { font-size: 11px; color: rgba(255,255,255,0.15); font-weight: 500; letter-spacing: 0.06em; white-space: nowrap; }

        @media (max-width: 480px) {
          .card { width: 94vw; padding: 36px 26px; }
          .heading { font-size: 30px; }
        }
      `}</style>

      <div className="page">
        <div className="bg">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
          <div className="grid" />
        </div>

        <div className="card" ref={panelRef}>
          {/* Logo */}
          <div className="logo-row">
            <div className="logo-box">H</div>
            <div>
              <div className="logo-name">ANY Dashboard</div>
              <div className="logo-tag">HOMER System</div>
            </div>
          </div>

          {/* Heading */}
          <div className="heading-wrap">
            <h1 className="heading">Welcome <span className="hl">back.</span></h1>
            <p className="sub">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="form-wrap">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="13" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16.5" r="1.2" fill="#f87171"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="field">
                <label className="lbl" htmlFor="email">Email</label>
                <div className="inp-row">
                  <span className="ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="3"/>
                      <path d="m2 7 10 7 10-7"/>
                    </svg>
                  </span>
                  <input className="inp" id="email" type="email" placeholder="you@homer.org"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" />
                </div>
              </div>

              <div className="field">
                <label className="lbl" htmlFor="password">Password</label>
                <div className="inp-row">
                  <span className="ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input className="inp inp-r" id="password" type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                  <button type="button" className="eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button className="btn" type="submit" disabled={loading}>
                <div className="btn-in">
                  {loading ? (
                    <><div className="spin" /> Signing in…</>
                  ) : (
                    <>
                      Sign In
                      <svg className="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="foot">
            <div className="foot-line" />
            <span className="foot-txt">HOMER · Rehabilitation Management</span>
            <div className="foot-line" />
          </div>
        </div>
      </div>
    </>
  );
}