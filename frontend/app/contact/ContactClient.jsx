'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitContactMessage } from '@/lib/api';

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await submitContactMessage(form);
      toast.success('Message sent. We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error(err?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
      <h1 className="text-2xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h1>
      <p className="text-gray-600 mb-12">We would love to hear from you. Reach out to us for any queries about our authentic luxury fragrances.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="card p-6 border border-gray-100">
            <h3 className="font-semibold text-lg mb-2">Customer Support</h3>
            <p className="text-sm text-gray-500 mb-4">For order inquiries, tracking, and product questions.</p>
            <p className="text-sm font-medium">Email: <a href="mailto:support@spraykart.in" className="text-black hover:underline">support@spraykart.in</a></p>
          </div>

          <div className="card p-6 border border-gray-100">
            <h3 className="font-semibold text-lg mb-2">Business Hours</h3>
            <p className="text-sm text-gray-500">Monday - Friday: 10:00 AM - 6:00 PM (IST)</p>
            <p className="text-sm text-gray-500 mt-1">Saturday: 10:00 AM - 2:00 PM (IST)</p>
            <p className="text-sm text-gray-400 mt-2 text-xs">Closed on Sundays and Public Holidays.</p>
          </div>
        </div>

        <div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="input" placeholder="Your full name" required value={form.name} onChange={handleChange('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" placeholder="you@example.com" required value={form.email} onChange={handleChange('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea className="input" rows="5" placeholder="How can we help you?" required value={form.message} onChange={handleChange('message')}></textarea>
            </div>
            <button className="btn-primary w-full py-3 mt-2" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
            <p className="text-xs text-center text-gray-400 mt-4">We usually respond within 24 hours.</p>
          </form>
        </div>
      </div>
    </div>
  );
}