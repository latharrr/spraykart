'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Link from 'next/link';

function AccordionItem({ faq, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid #f0f0f0',
      transition: 'background .15s',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 20,
          padding: '22px 0', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#c8c8c8',
            minWidth: 24, paddingTop: 2,
            fontFamily: 'monospace',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
            {faq.question}
          </span>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          border: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? '#0c0c0c' : '#fff',
          color: open ? '#fff' : '#0c0c0c',
          transition: 'all .2s',
          marginTop: 2,
        }}>
          {open ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
        </div>
      </button>

      <div style={{
        maxHeight: open ? 600 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ paddingLeft: 40, paddingBottom: 24 }}>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8 }}>
            {faq.answer}
          </p>
          {faq.image_url && (
            <div style={{ marginTop: 16 }}>
              <img
                src={faq.image_url}
                alt={faq.question}
                style={{
                  maxWidth: '100%', maxHeight: 300,
                  borderRadius: 8, border: '1px solid #f0f0f0',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FaqClient({ faqs }) {
  return (
    <main style={{ background: '#fafaf8', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#a0a0a0', marginBottom: 16,
        }}>
          Support
        </p>
        <h1 style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 300, letterSpacing: '-0.03em',
          color: '#0c0c0c', lineHeight: 1.1, marginBottom: 20,
        }}>
          Frequently Asked<br />
          <em style={{ fontStyle: 'italic' }}>Questions</em>
        </h1>
        <p style={{ fontSize: 16, color: '#737373', maxWidth: 440, margin: '0 auto' }}>
          Everything you need to know about Spraykart. Can't find the answer?{' '}
          <Link href="/contact" style={{ color: '#0c0c0c', fontWeight: 600, textDecorationLine: 'underline', textUnderlineOffset: 3 }}>
            Contact us
          </Link>
        </p>
      </div>

      {/* FAQ accordion */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        {faqs.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0a0a0', padding: 48 }}>No FAQs available yet.</p>
        ) : (
          <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #e8e8e8', padding: '0 28px' }}>
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.id} faq={faq} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 48, padding: '32px 28px', background: '#0c0c0c',
          borderRadius: 4, textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Still have questions?
          </p>
          <p style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 24, fontFamily: "Georgia, serif" }}>
            We're here to help
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: '#fff', color: '#0c0c0c', borderRadius: 2,
              textDecoration: 'none',
            }}>
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
