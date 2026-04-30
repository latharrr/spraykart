'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';



const QUESTIONS = [
  {
    id: 'occasion',
    question: 'When will you wear this fragrance?',
    subtitle: 'Choose your primary occasion',
    options: [
      { label: 'Daily Wear', emoji: '☀️', value: 'daily' },
      { label: 'Special Occasion', emoji: '✨', value: 'special' },
      { label: 'Office / Work', emoji: '💼', value: 'office' },
      { label: 'Date Night', emoji: '❤️', value: 'date' },
    ],
  },
  {
    id: 'intensity',
    question: 'How strong do you want it?',
    subtitle: 'Pick your preferred intensity',
    options: [
      { label: 'Light & Fresh', emoji: '🌿', value: 'fresh' },
      { label: 'Moderate', emoji: '🌸', value: 'moderate' },
      { label: 'Strong & Bold', emoji: '🔥', value: 'strong' },
      { label: 'Very Intense', emoji: '💥', value: 'intense' },
    ],
  },
  {
    id: 'season',
    question: 'What season is it for?',
    subtitle: 'Fragrances perform differently in each season',
    options: [
      { label: 'Summer', emoji: '🌞', value: 'summer' },
      { label: 'Winter', emoji: '❄️', value: 'winter' },
      { label: 'Monsoon / Spring', emoji: '🌧️', value: 'spring' },
      { label: 'All Seasons', emoji: '🌈', value: 'all' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your budget?',
    subtitle: 'We have luxury options at every price point',
    options: [
      { label: 'Under ₹500', emoji: '💚', value: '0-500' },
      { label: '₹500 – ₹1,500', emoji: '💛', value: '500-1500' },
      { label: '₹1,500 – ₹3,000', emoji: '🧡', value: '1500-3000' },
      { label: 'Above ₹3,000', emoji: '💜', value: '3000-999999' },
    ],
  },
  {
    id: 'gender',
    question: 'Who is this for?',
    subtitle: 'Help us personalise the recommendation',
    options: [
      { label: 'For Him', emoji: '👨', value: 'Men' },
      { label: 'For Her', emoji: '👩', value: 'Women' },
      { label: 'Unisex', emoji: '🌟', value: 'Unisex' },
      { label: 'Gift (not sure)', emoji: '🎁', value: '' },
    ],
  },
];

// Map answers → product filter URL
function buildResultUrl(answers) {
  const params = new URLSearchParams();
  const budget = answers.budget?.split('-');
  if (budget?.[0]) params.set('price_min', budget[0]);
  if (budget?.[1]) params.set('price_max', budget[1]);
  if (answers.gender) params.set('category', answers.gender);
  if (answers.occasion === 'office') params.set('occasion', 'Office');
  else if (answers.occasion === 'date') params.set('occasion', 'Date Night');
  else if (answers.occasion === 'special') params.set('occasion', 'Party');
  if (answers.intensity === 'fresh') params.set('note', 'Fresh');
  else if (answers.intensity === 'intense' || answers.intensity === 'strong') params.set('note', 'Oud');
  params.set('sort', 'created_at:DESC');
  return `/products?${params.toString()}`;
}

export default function FragranceFinderPage() {
  const [step, setStep] = useState(0); // -1 = intro, 0-4 = questions, 5 = result
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);

  const current = QUESTIONS[step];
  const progress = started ? ((step + 1) / QUESTIONS.length) * 100 : 0;
  const resultUrl = buildResultUrl(answers);

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 280);
    } else {
      setTimeout(() => setStep(QUESTIONS.length), 280);
    }
  };

  if (!started) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', background: '#fafaf8',
      }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#0c0c0c', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <Sparkles size={28} />
          </div>
          <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', display: 'block', marginBottom: 16 }}>
            Premium Feature
          </span>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, letterSpacing: '-0.02em', color: '#0c0c0c', lineHeight: 1.1, marginBottom: 16 }}>
            Find Your<br /><em style={{ fontStyle: 'italic' }}>Perfect Fragrance</em>
          </h1>
          <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.7, marginBottom: 40 }}>
            Answer 5 quick questions and we'll recommend the ideal fragrance for you — from our curated collection of 100% authentic luxury scents.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            {['5 Questions', '~2 Minutes', 'Personalised Results'].map(tag => (
              <span key={tag} style={{ padding: '6px 14px', border: '1px solid #e8e8e8', borderRadius: 100, fontSize: 12, color: '#737373' }}>
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => setStarted(true)}
            className="btn-primary"
            style={{ padding: '14px 40px', fontSize: 12, gap: 10 }}
          >
            Start the Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (step === QUESTIONS.length) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', background: '#fafaf8',
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#0c0c0c', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <Check size={32} />
          </div>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.02em', color: '#0c0c0c', lineHeight: 1.1, marginBottom: 16 }}>
            Your Fragrances<br /><em style={{ fontStyle: 'italic' }}>Are Ready</em>
          </h2>
          <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.7, marginBottom: 40 }}>
            Based on your preferences, we've curated a personalised selection just for you. Explore and find your signature scent.
          </p>

          {/* Answer summary */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, padding: '20px 24px', marginBottom: 40, textAlign: 'left' }}>
            {QUESTIONS.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                <span style={{ color: '#737373' }}>{q.question.split('?')[0]}</span>
                <span style={{ fontWeight: 600, color: '#0c0c0c' }}>
                  {q.options.find(o => o.value === answers[q.id])?.label || '—'}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={resultUrl} className="btn-primary" style={{ padding: '14px 36px', fontSize: 12 }}>
              See My Fragrances <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => { setStep(0); setAnswers({}); }}
              className="btn-secondary"
              style={{ padding: '14px 28px', fontSize: 12 }}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', background: '#fafaf8', padding: '48px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a0a0a0' }}>
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 11, color: '#a0a0a0' }}>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: 2, background: '#e8e8e8', borderRadius: 1 }}>
            <div style={{
              height: '100%', background: '#0c0c0c', borderRadius: 1,
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 12 }}>
            {current.subtitle}
          </p>
          <h2 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: 'clamp(24px, 4vw, 38px)',
            fontWeight: 300, letterSpacing: '-0.02em',
            color: '#0c0c0c', lineHeight: 1.2,
          }}>
            {current.question}
          </h2>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 40 }}>
          {current.options.map((opt) => {
            const selected = answers[current.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '20px 16px',
                  border: `2px solid ${selected ? '#0c0c0c' : '#e8e8e8'}`,
                  borderRadius: 4,
                  background: selected ? '#0c0c0c' : '#fff',
                  color: selected ? '#fff' : '#0c0c0c',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#737373',
              background: 'none', border: 'none', cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            <ArrowLeft size={12} /> Back
          </button>
        )}
      </div>
    </div>
  );
}
