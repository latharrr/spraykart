import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 text-center">
      <p className="text-8xl font-bold text-gray-100">404</p>
      <h1 className="text-2xl font-bold text-gray-900 -mt-4">Page not found</h1>
      <p className="text-gray-500 text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3 mt-2">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/products" className="btn-secondary">Browse products</Link>
      </div>
    </div>
  );
}
