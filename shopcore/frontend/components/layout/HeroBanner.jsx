import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-6 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Free shipping on orders above ₹999
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight max-w-4xl">
          Premium products,{' '}
          <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            unbeatable prices
          </span>
        </h1>

        <p className="mt-6 text-lg text-gray-300 max-w-xl leading-relaxed">
          Discover thousands of hand-picked products with fast delivery and hassle-free returns.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link href="/products" className="btn-primary text-base px-8 py-3.5 gap-2">
            Shop now <ArrowRight size={18} />
          </Link>
          <Link href="/products?is_featured=true" className="btn-secondary text-base px-8 py-3.5 bg-white/10 text-white border-white/20 hover:bg-white/20">
            Featured deals
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-16 text-sm text-gray-400">
          {[
            { icon: ShieldCheck, text: 'Secure checkout' },
            { icon: Truck, text: 'Fast delivery' },
            { icon: RefreshCcw, text: '30-day returns' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={16} className="text-gray-500" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
