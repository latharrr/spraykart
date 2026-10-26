// Shared frame for sign-in, register and password reset: an ink panel that states the house, and the form.
export default function AuthShell({ title, lede, children }) {
  return (
    <div className="au">
      <div className="au__img h-inverse on-ink" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(40px, 5vw, 80px) var(--gutter)' }}>
        <p className="t-display t-xl" style={{ maxWidth: '9ch' }}>Designer, niche and attar.</p>
        <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginTop: 36, color: 'var(--on-ink-2)' }} className="t-small">
          <li>Originals only, with a GST invoice in your name.</li>
          <li>Free delivery above ₹999 across India.</li>
          <li>Track every order from your account.</li>
        </ul>
      </div>
      <div className="au__form">
        <div>
          <h1 className="t-display t-l">{title}</h1>
          {lede && <p className="t-body t-mute">{lede}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

// Only same-site relative paths are allowed as post-auth destinations.
export function safeRedirect(value, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
