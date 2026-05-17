export const loginPageStyles = `
  .login-page-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    color: var(--text);
    background:
      radial-gradient(circle at 18% 36%, rgba(10, 132, 162, 0.18), transparent 28%),
      radial-gradient(circle at 78% 52%, rgba(13, 148, 136, 0.09), transparent 22%),
      var(--app-shell-gradient),
      var(--bg);
  }

  .login-page-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent 85%);
    pointer-events: none;
    opacity: 0.35;
  }

  .login-page-layout {
    position: relative;
    z-index: 1;
    display: grid;
    min-height: 100svh;
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    align-items: center;
    gap: clamp(2rem, 2.8vw, 3rem);
    padding: clamp(1rem, 2vh, 1.6rem) 2.5rem;
    grid-template-columns: minmax(0, 1.7fr) minmax(340px, 0.9fr);
  }

  .login-page-left {
    max-width: 880px;
  }

  .login-page-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1.4rem;
  }

  .login-page-brand-badge {
    display: flex;
    height: 2.8rem;
    width: 2.8rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.9rem;
    border: 1px solid var(--accent-border);
    background: var(--panel-soft-bg);
    box-shadow: inset 0 1px 0 rgba(125, 211, 252, 0.08);
    backdrop-filter: blur(14px);
  }

  .login-page-brand-text {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--accent);
  }

  .login-page-intro {
    max-width: 52rem;
    margin-bottom: 1.4rem;
    font-size: clamp(1.02rem, 1.45vw, 1.28rem);
    line-height: 1.58;
    letter-spacing: -0.02em;
    color: var(--summary-muted);
  }

  .login-page-cards {
    display: grid;
    gap: 0.8rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .login-page-card {
    min-height: 10rem;
    padding: 0.95rem 1rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid var(--panel-border);
    background: var(--panel-soft-bg);
    box-shadow:
      inset 0 1px 0 rgba(148, 197, 255, 0.04),
      0 22px 36px rgba(2, 6, 23, 0.12);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .login-page-card:hover {
    transform: translateY(-2px);
    border-color: var(--panel-border-strong);
    box-shadow:
      inset 0 1px 0 rgba(148, 197, 255, 0.06),
      0 26px 42px rgba(2, 6, 23, 0.18);
  }

  .login-page-card-icon {
    display: flex;
    height: 2.6rem;
    width: 2.6rem;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
    border-radius: 0.8rem;
    background: var(--panel-subtle-bg);
  }

  .login-page-card-title {
    margin-bottom: 0.45rem;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-h);
  }

  .login-page-card-copy {
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--summary-muted);
  }

  .login-form-wrap {
    width: 100%;
    max-width: 29rem;
    justify-self: end;
  }

  .login-form-card {
    width: 100%;
    border-radius: 1.9rem;
    border: 1px solid var(--panel-border);
    background: var(--panel-soft-bg);
    padding: 2.4rem 2.2rem 2rem;
    box-shadow:
      inset 0 1px 0 rgba(125, 211, 252, 0.03),
      0 24px 50px rgba(2, 8, 20, 0.14);
    backdrop-filter: blur(16px);
  }

  .login-form-header-icon {
    display: flex;
    height: 4.2rem;
    width: 4.2rem;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.35rem;
    border-radius: 1.15rem;
    border: 1px solid var(--accent-border);
    background: var(--panel-subtle-bg);
    box-shadow: inset 0 1px 0 rgba(103, 232, 249, 0.08);
  }

  .login-form-kicker {
    font-size: 0.88rem;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
    color: var(--accent);
  }

  .login-form-title {
    margin-top: 0.55rem;
    font-size: clamp(2.8rem, 3.3vw, 3.7rem);
    line-height: 0.95;
    font-weight: 800;
    letter-spacing: -0.06em;
    color: var(--text-h);
  }

  .login-form-copy {
    margin-top: 1rem;
    margin-bottom: 2rem;
    font-size: 0.94rem;
    line-height: 1.5;
    color: var(--summary-muted);
  }

  .login-form-label {
    display: block;
    margin-bottom: 0.55rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-h);
  }

  .login-form-field {
    position: relative;
  }

  .login-form-field-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    z-index: 1;
    transform: translateY(-50%);
    color: var(--kpi-title);
    pointer-events: none;
  }

  .login-form-input {
    width: 100%;
    border-radius: 0.85rem;
    border: 1px solid var(--panel-border);
    background: var(--panel-input-bg);
    padding: 0.82rem 1rem 0.82rem 3.1rem;
    font-size: 0.95rem;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }

  .login-form-input::placeholder {
    color: var(--kpi-title);
  }

  .login-form-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
    background: var(--panel-input-bg);
  }

  .login-form-forgot {
    display: inline-block;
    margin-top: 0.85rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
  }

  .login-form-button {
    width: 100%;
    border-radius: 0.8rem;
    border: 1px solid var(--accent-border);
    background: linear-gradient(180deg, rgba(10, 88, 119, 0.98), rgba(8, 76, 104, 0.98));
    margin-top: 1.8rem;
    padding: 0.9rem 1rem;
    font-size: 1.02rem;
    font-weight: 800;
    color: #dff8ff;
    transition: transform 0.15s ease, border-color 0.2s ease, filter 0.2s ease;
  }

  .login-form-button:hover {
    border-color: var(--accent);
    filter: brightness(1.06);
  }

  .login-form-button:active {
    transform: scale(0.98);
  }

  .login-form-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 1024px) {
    .login-page-layout {
      gap: 2.5rem;
      padding: 1.75rem 1.5rem 2.5rem;
      grid-template-columns: 1fr;
    }

    .login-page-left {
      max-width: 100%;
    }

    .login-form-wrap {
      max-width: 32rem;
      justify-self: start;
    }
  }

  @media (max-height: 920px) and (min-width: 1025px) {
    .login-page-layout {
      gap: 1.6rem;
      padding-top: 0.8rem;
      padding-bottom: 0.8rem;
    }

    .login-page-brand {
      margin-bottom: 1rem;
    }

    .login-page-intro {
      margin-bottom: 1rem;
      font-size: 0.98rem;
      line-height: 1.48;
    }

    .login-page-card {
      min-height: 8.9rem;
      padding-top: 0.85rem;
      padding-bottom: 0.9rem;
    }

    .login-page-card-copy {
      font-size: 0.84rem;
      line-height: 1.35;
    }

    .login-form-card {
      padding-top: 1.8rem;
      padding-bottom: 1.6rem;
    }

    .login-form-header-icon {
      height: 3.7rem;
      width: 3.7rem;
      margin-bottom: 1rem;
    }

    .login-form-title {
      font-size: clamp(2.45rem, 3vw, 3.2rem);
    }

    .login-form-copy {
      margin-bottom: 1.45rem;
    }

    .login-form-button {
      margin-top: 1.35rem;
    }
  }

  @media (max-width: 860px) {
    .login-page-cards {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .login-page-layout {
      gap: 2rem;
      padding: 1.25rem 1rem 2rem;
    }

    .login-page-brand {
      margin-bottom: 1.5rem;
    }

    .login-page-brand-text {
      font-size: 1rem;
    }

    .login-page-intro {
      margin-bottom: 1.4rem;
      font-size: 1.05rem;
    }

    .login-form-card {
      padding: 1.6rem 1.2rem 1.4rem;
    }
  }
`;
