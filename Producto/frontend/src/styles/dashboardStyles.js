export const btnStyles = {
  primary: {
    fontFamily: 'Almendra, serif',
    background: 'rgba(226, 209, 166, 0.08)',
    color: 'var(--fantasy-gold)',
    border: '1px solid var(--fantasy-gold)',
    borderRadius: 12,
    padding: '0.65rem 1.25rem',
    fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    transition: 'all 0.2s',
    boxShadow: '0 0 15px var(--fantasy-accent-glow)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  secondary: {
    fontFamily: 'Almendra, serif',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--fantasy-gold)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '0.65rem 1.25rem',
    fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    transition: 'background 0.2s',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  accent: {
    background: 'linear-gradient(135deg, rgb(181, 133, 46), #c9873cff)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '0.65rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', flex: 1,
    transition: 'opacity 0.2s',
  },
  ghost: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(226,209,166,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '0.65rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', flex: 1,
    transition: 'background 0.2s',
  },
}

export const labelStyle = {
  display: 'block',
  color: 'rgba(226,209,166,0.8)',
  fontWeight: 600,
  fontSize: '0.825rem',
  marginBottom: '0.5rem',
  letterSpacing: '0.05em',
}

export const inputStyle = {
  width: '100%',
  background: '#1a1a1a', // Solid background to prevent white-on-white issues in dropdowns
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}
