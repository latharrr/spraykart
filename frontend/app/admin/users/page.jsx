'use client';
import { useState, useCallback } from 'react';
import { adminGetUsers, adminToggleBlock } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Search, Phone, Mail } from 'lucide-react';

// Build WhatsApp link for a user
function waLink(phone, name) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('91') ? clean : `91${clean}`;
  const msg = encodeURIComponent(`Hi ${name || 'there'}, this is Spraykart! 👋 How can we help you today?`);
  return `https://wa.me/${number}?text=${msg}`;
}

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
        <h1 className="text-2xl font-bold">Customers</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input text-sm pl-8 py-2 w-64"
              placeholder="Search name, email or phone..."
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
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Mobile</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Joined</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Orders</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Total Spent</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {users.map((user) => {
                  const wa = waLink(user.phone, user.name);
                  return (
                    <tr key={user.id} className="hover:bg-[#f9fafb] transition group">
                      {/* Customer name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0c0c0c] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1a1a]">{user.name}</p>
                            <a href={`mailto:${user.email}`} className="text-[12px] text-[#6b7280] hover:text-[#1a1a1a] flex items-center gap-1">
                              <Mail size={11} /> {user.email}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Phone + WhatsApp */}
                      <td className="px-4 py-3">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${user.phone}`} className="text-[#4b5563] font-mono text-[12px] hover:text-[#1a1a1a] flex items-center gap-1">
                              <Phone size={11} /> {user.phone}
                            </a>
                            {wa && (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: 26, height: 26, borderRadius: 6,
                                  background: '#25d366', color: '#fff', flexShrink: 0,
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#d1d5db] text-[12px]">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#6b7280]">
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-medium">{user.order_count || 0}</td>
                      <td className="px-4 py-3 font-semibold text-[#1a1a1a]">₹{parseFloat(user.total_spent || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.is_blocked ? 'blocked' : 'active'}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleBlock(user)}
                          disabled={togglingId === user.id}
                          className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition ${
                            user.is_blocked
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {togglingId === user.id ? <Spinner size="sm" /> : user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#f3f4f6] text-[12px] text-[#9ca3af]">
            {data?.total || users.length} customers total
          </div>
        </div>
      )}
    </div>
  );
}
