import clsx from 'clsx';

const variants = {
  pending:   'bg-yellow-50 text-yellow-800',
  confirmed: 'bg-blue-50 text-blue-800',
  shipped:   'bg-indigo-50 text-indigo-800',
  delivered: 'bg-green-50 text-green-800',
  cancelled: 'bg-red-50 text-red-800',
  active:    'bg-green-50 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  blocked:   'bg-red-50 text-red-700',
  approved:  'bg-green-50 text-green-700',
  pending_review: 'bg-orange-50 text-orange-700',
  featured:  'bg-purple-50 text-purple-700',
  default:   'bg-gray-100 text-gray-700',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={clsx('badge', variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  return <Badge variant={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}
