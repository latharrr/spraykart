export const metadata = {
  title: 'Contact Us | Spraykart',
  description: 'Get in touch with Spraykart for any questions regarding our luxury fragrances.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h1>
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
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="input" placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea className="input" rows="5" placeholder="How can we help you?" required></textarea>
            </div>
            <button className="btn-primary w-full py-3 mt-2">Send Message</button>
            <p className="text-xs text-center text-gray-400 mt-4">We usually respond within 24 hours.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
