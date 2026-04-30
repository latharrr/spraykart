import Link from 'next/link';

export const metadata = {
  title: 'Spraykart Machine — The Future of Fragrance',
  description: 'Walk up. Explore. Spray. The Spraykart Machine lets you experience premium luxury fragrances on-demand, anytime, anywhere. Coming soon.',
};

export default function SpraykartMachinePage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ffffff', fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Ambient gradient orbs */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,90,220,0.18) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,120,80,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', top: '30%', left: '-5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(80,160,220,0.10) 0%, transparent 70%)',
          }} />
        </div>

        {/* Badge */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 40 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 100,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.04)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#a78bfa',
              boxShadow: '0 0 8px #a78bfa',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            Coming Soon
          </span>
        </div>

        {/* Main heading */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, marginBottom: 32 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            marginBottom: 20,
          }}>
            Something Game-Changing Is On Its Way
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 'clamp(42px, 7vw, 88px)',
            fontWeight: 300,
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: 0,
          }}>
            The Spraykart<br />
            <em style={{ fontStyle: 'italic', fontWeight: 300 }}>Machine</em>
          </h1>
        </div>

        {/* Sub-heading */}
        <p style={{
          position: 'relative', zIndex: 1,
          fontSize: 'clamp(15px, 2vw, 19px)',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7, maxWidth: 560, marginBottom: 64,
        }}>
          We're not just selling fragrances anymore.<br />
          We're redefining how you <em style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>experience</em> them.
        </p>

        {/* Scroll cue */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Scroll to explore
          </span>
          <div style={{
            width: 1, height: 56,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)',
          }} />
        </div>
      </section>

      {/* ── THE IDEA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)', marginBottom: 24,
        }}>
          The Concept
        </p>
        <h2 style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 300, letterSpacing: '-0.02em',
          color: '#ffffff', lineHeight: 1.2, marginBottom: 48,
        }}>
          Walk up. Explore.<br />
          <span style={{ color: 'rgba(167,139,250,0.9)' }}>Spray.</span>
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 1,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          {[
            {
              step: '01',
              title: 'Walk Up',
              desc: 'Approach the sleek Spraykart Machine — placed at premium locations near you.',
              color: 'rgba(167,139,250,0.7)',
            },
            {
              step: '02',
              title: 'Explore',
              desc: 'Browse top luxury fragrances on the interactive display. Find your mood.',
              color: 'rgba(96,165,250,0.7)',
            },
            {
              step: '03',
              title: 'Experience',
              desc: 'Get the perfect amount — instantly. No commitment. No full bottle.',
              color: 'rgba(251,146,60,0.7)',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} style={{
              padding: '48px 40px',
              background: '#0f0f0f',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span style={{
                display: 'block',
                fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em',
                color: 'rgba(255,255,255,0.04)',
                lineHeight: 1, marginBottom: 24,
                fontFamily: 'system-ui',
              }}>{step}</span>
              <h3 style={{
                fontSize: 20, fontWeight: 600, color: '#ffffff',
                marginBottom: 12, letterSpacing: '-0.01em',
              }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{desc}</p>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 2, background: color,
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY IT MATTERS ────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: 24,
          }}>Why It Matters</p>
          <h2 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 300, letterSpacing: '-0.02em',
            color: '#ffffff', lineHeight: 1.2, marginBottom: 64,
          }}>
            This isn't just a machine—<br />
            <em style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>it's a new way to experience perfumes.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { emoji: '🧪', text: 'Try premium fragrances before investing in full bottles' },
              { emoji: '🚀', text: 'Access luxury scents on-the-go, wherever you are' },
              { emoji: '💰', text: 'Pay only for what you use — no waste, no commitment' },
              { emoji: '✨', text: 'Designed for convenience, hygiene, and speed' },
            ].map(({ emoji, text }) => (
              <div key={text} style={{
                padding: '32px 28px',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 16 }}>{emoji}</span>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT FOR EVERYDAY MOMENTS ───────────────────────────────────── */}
      <section style={{ padding: '100px 24px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)', marginBottom: 24,
        }}>Everyday Moments</p>
        <h2 style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 300, letterSpacing: '-0.02em',
          color: '#ffffff', lineHeight: 1.2, marginBottom: 48,
        }}>
          Built for <em style={{ fontStyle: 'italic' }}>every</em> occasion
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 64 }}>
          {[
            '🎉 Party', '💼 Meeting', '❤️ Date Night',
            '🌅 Morning Ritual', '✈️ Travel', '🎓 Graduation',
          ].map((label) => (
            <span key={label} style={{
              padding: '12px 24px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 100,
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.03)',
              letterSpacing: '0.02em',
            }}>
              {label}
            </span>
          ))}
        </div>

        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8,
          maxWidth: 560, borderLeft: '2px solid rgba(167,139,250,0.4)',
          paddingLeft: 24,
        }}>
          Whether you're heading to a party, a date, a meeting, or just want to feel fresh — the Spraykart Machine makes sure you're always ready.
        </p>
      </section>

      {/* ── VIDEO PLACEHOLDER ────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: 24,
          }}>🎥 See It in Action</p>
          <h2 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 300, letterSpacing: '-0.02em',
            color: '#ffffff', lineHeight: 1.2, marginBottom: 48,
          }}>Watch the Machine<br /><em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>come to life</em></h2>

          {/* Video embed area */}
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background shimmer */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(120,90,220,0.08) 0%, transparent 70%)',
            }} />
            {/* Play icon */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
              background: 'rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 24, marginLeft: 4 }}>▶</span>
            </div>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              position: 'relative', zIndex: 1,
            }}>
              Video coming soon
            </p>
          </div>
        </div>
      </section>

      {/* ── LAUNCHING SOON CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,90,220,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: 24,
          }}>Launching Soon</p>

          <h2 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 300, letterSpacing: '-0.03em',
            color: '#ffffff', lineHeight: 1.1, marginBottom: 24,
          }}>
            Be Among the First<br />
            <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>to Experience It</em>
          </h2>

          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7,
            maxWidth: 480, margin: '0 auto 56px',
          }}>
            We're getting ready to roll this out — and trust us, it's worth the wait.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 36px',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: '#ffffff', color: '#0a0a0a',
              textDecoration: 'none', borderRadius: 2,
              transition: 'opacity 0.15s',
            }}>
              Shop Fragrances Now
            </Link>
            <Link href="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 36px',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'transparent', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              textDecoration: 'none', borderRadius: 2,
              transition: 'border-color 0.15s, color 0.15s',
            }}>
              Get Notified
            </Link>
          </div>
        </div>
      </section>

      {/* Pulse dot keyframe */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </main>
  );
}
