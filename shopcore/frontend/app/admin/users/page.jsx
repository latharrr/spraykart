'use client';
import { useState, useCallback } from 'react';
import { adminGetUsers, adminToggleBlock } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(() => adminGetUsers({ search, limit: 30 }), [search]);
  const { data, loading, error, refetch } = useFetch(fetchUsers, [search]);
  const users = data?.users || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleToggleBlock = async (user) => {
    setTogglingId(user.id);
    try {
      await adminToggleBlock(user.id);
      toast.success(`User ${user.is_blocked ? 'unblocked' : 'blocked'}`);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to update user');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input text-sm pl-8 py-2 w-56"
              placeholder="Search name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary text-sm py-2 px-4">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 skeleton rounded-full shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-1/3" /><div className="h-3 skeleton rounded w-1/4" /></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : users.length === 0 ? (
        <EmptyState icon="users" title="No users found" description={search ? 'No users match your search' : 'No customers yet'} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Total Spent</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="table-td">{user.order_count || 0}</td>
                    <td className="table-td font-medium">₹{parseFloat(user.total_spent || 0).toLocaleString('en-IN')}</td>
                    <td className="table-td">
                      <Badge variant={user.is_blocked ? 'blocked' : 'active'}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => handleToggleBlock(user)}
                        disabled={togglingId === user.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                          user.is_blocked
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {togglingId === user.id ? <Spinner size="sm" /> : user.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {data?.total || users.length} customers total
          </div>
        </div>
      )}
    </div>
  );
}
