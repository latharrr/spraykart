'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Link from 'next/link';

function AccordionItem({ faq, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid #E2DFD8',
      transition: 'background .15s',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 'clamp(8px, 3vw, 20px)',
          padding: 'clamp(16px, 4vw, 22px) 0', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', gap: 'clamp(8px, 3vw, 16px)', alignItems: 'flex-start', flex: 1 }}>
          <span style={{
            fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 700, color: '#CFCCC4',
            minWidth: 24, paddingTop: 2,
            fontFamily: 'monospace',
            flexShrink: 0,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{ 
            fontSize: 'clamp(14px, 4vw, 16px)', 
            fontWeight: 600, color: '#0D0D0D', 
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}>
            {faq.question}
          </span>
        </div>
        <div style={{
          width: 'clamp(24px, 6vw, 28px)', 
          height: 'clamp(24px, 6vw, 28px)', 
          borderRadius: '50%', flexShrink: 0,
          border: '1px solid #E2DFD8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? '#0D0D0D' : '#fff',
          color: open ? '#fff' : '#0D0D0D',
          transition: 'all .2s',
          marginTop: 2,
        }}>
          {open ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
        </div>
      </button>

      <div style={{
        maxHeight: open ? 2000 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ paddingLeft: 'clamp(24px, 6vw, 40px)', paddingBottom: 'clamp(16px, 4vw, 24px)' }}>
          <p style={{ 
            fontSize: 'clamp(13px, 3vw, 15px)', 
            color: '#55534D', 
            lineHeight: 1.8,
            wordBreak: 'break-word',
          }}>
            {faq.answer}
          </p>
          {faq.image_url && (
            <div style={{ marginTop: 'clamp(12px, 3vw, 16px)' }}>
              <img
                src={faq.image_url}
                alt={faq.question}
                style={{
                  maxWidth: '100%', maxHeight: 'clamp(200px, 50vw, 300px)',
                  borderRadius: 0, border: '1px solid #E2DFD8',
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
    <div style={{ background: '#F6F4EF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{
        width: '100%', padding: 'clamp(40px, 10vw, 80px) 24px clamp(30px, 8vw, 60px)',
        textAlign: 'center',
      }}>
        <h1 className="t-display t-xl" style={{
          color: '#0D0D0D', marginBottom: 'clamp(16px, 4vw, 20px)',
        }}>
          Frequently Asked<br />
          <em style={{ fontStyle: 'italic' }}>Questions</em>
        </h1>
        <p style={{ 
          fontSize: 'clamp(14px, 3vw, 16px)', color: '#55534D', 
          maxWidth: 560, margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Everything you need to know about Spraykart. Can't find the answer?{' '}
          <Link href="/contact" style={{ color: '#0D0D0D', fontWeight: 600, textDecorationLine: 'underline', textUnderlineOffset: 3 }}>
            Contact us
          </Link>
        </p>
      </div>

      {/* FAQ accordion */}
      <div style={{ flex: 1, width: '100%', padding: '0 24px clamp(40px, 10vw, 80px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {faqs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6E6B64', padding: 'clamp(24px, 5vw, 48px)' }}>No FAQs available yet.</p>
          ) : (
            <div style={{ background: '#fff', borderRadius: 0, border: '1px solid #E2DFD8', padding: 'clamp(16px, 4vw, 28px)' }}>
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.id} faq={faq} index={i} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{
            marginTop: 'clamp(32px, 8vw, 48px)', 
            padding: 'clamp(24px, 6vw, 32px)', 
            background: '#0D0D0D',
            borderRadius: 0, textAlign: 'center',
          }}>
            <p style={{ 
              fontSize: 'clamp(11px, 2vw, 13px)', 
              color: 'rgba(255,255,255,.5)', 
              marginBottom: 'clamp(6px, 2vw, 8px)', 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase' 
            }}>
              Still have questions?
            </p>
            <p style={{ 
              fontSize: 'clamp(18px, 5vw, 20px)', 
              fontWeight: 300, color: '#fff', 
              marginBottom: 'clamp(16px, 4vw, 24px)', 
              fontFamily: "Georgia, serif" 
            }}>
              We're here to help
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: 'clamp(8px, 2vw, 10px) clamp(16px, 4vw, 24px)', 
                fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#fff', color: '#0D0D0D', borderRadius: 0,
                textDecoration: 'none',
              }}>
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
