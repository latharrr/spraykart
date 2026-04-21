import { ShoppingBag, Package, Users, Tag, Star, FileX } from 'lucide-react';
import Link from 'next/link';

const ICONS = { bag: ShoppingBag, package: Package, users: Users, tag: Tag, star: Star, file: FileX };

export default function EmptyState({
  icon = 'bag',
  title = 'Nothing here yet',
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  const Icon = ICONS[icon] || ShoppingBag;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-xs">{description}</p>}
      {(actionLabel && actionHref) && (
        <Link href={actionHref} className="btn-primary mt-6 text-sm">
          {actionLabel}
        </Link>
      )}
      {(actionLabel && onAction) && (
        <button onClick={onAction} className="btn-primary mt-6 text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
