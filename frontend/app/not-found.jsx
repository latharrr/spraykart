import Link from 'next/link';
import { Search } from 'lucide-react';

const categories = ['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets'];

export default function NotFound() {
  return (
    <div className="min-h-[72vh] bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <p className="section-label">404</p>
        <div className="grid md:grid-cols-[1.2fr_.8fr] gap-10 items-start">
          <div>
            <h1 className="serif text-5xl md:text-7xl font-medium leading-none text-[#0c0c0c]">
              This trail went cold.
            </h1>
            <p className="mt-5 text-sm md:text-base text-[#737373] max-w-xl">
              The page may have moved, but the collection is still close by. Search the store or jump into a popular category.
            </p>

            <form action="/products" className="mt-8 max-w-lg">
              <label htmlFor="not-found-search" className="sr-only">Search fragrances</label>
              <div className="flex bg-white border border-[#0c0c0c]">
                <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Search size={18} />
                </div>
                <input
                  id="not-found-search"
                  name="search"
                  className="flex-1 px-2 text-sm outline-none min-h-[48px]"
                  placeholder="Search perfumes, attars, brands"
                  autoComplete="off"
                />
                <button type="submit" className="btn-primary min-h-[48px] px-5">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="btn-secondary min-h-[44px]">Home</Link>
              <Link href="/products" className="btn-primary min-h-[44px]">Browse All</Link>
            </div>
          </div>

          <div className="bg-white border border-[#e8e8e8] p-6">
            <h2 className="text-xs uppercase tracking-[0.16em] font-semibold text-[#737373]">Popular Categories</h2>
            <div className="mt-5 grid gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="min-h-[44px] flex items-center justify-between border-b border-[#f2f2f2] text-sm hover:text-[#b8922a] transition"
                >
                  <span>{category}</span>
                  <span aria-hidden="true">/</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
