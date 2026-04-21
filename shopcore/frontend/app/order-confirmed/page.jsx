import Link from 'next/link';
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react';

export const metadata = { title: 'Order Confirmed' };

export default function OrderConfirmedPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
      <p className="text-gray-500 leading-relaxed mb-8">
        Your order has been placed successfully. You&apos;ll receive a confirmation email shortly.
        We&apos;ll notify you when your order ships.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/orders" className="btn-primary gap-2">
          <Package size={16} /> Track order
        </Link>
        <Link href="/products" className="btn-secondary gap-2">
          <ShoppingBag size={16} /> Continue shopping
        </Link>
      </div>
    </div>
  );
}
