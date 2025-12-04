import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { LayoutWrapper } from './layout-wrapper.jsx';

export const CustomerDetailPage = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
        const res = await fetch(`/api/admin/customers/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <LayoutWrapper activePage="customers"><div class="p-6">Loading...</div></LayoutWrapper>;
  if (!data) return <LayoutWrapper activePage="customers"><div class="p-6">Customer not found</div></LayoutWrapper>;

  const { user, orders } = data;

  return (
    <LayoutWrapper activePage="customers">
      <div class="p-6">
        {/* Header */}
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p class="text-gray-500">{user.email}</p>
                <div class="mt-2 text-sm text-gray-400">Customer ID: {user.id}</div>
            </div>
            <div class="text-right">
                <div class="text-sm text-gray-500">Joined</div>
                <div class="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">{orders.length}</dd>
            </div>
            <div class="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">
                    ${orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                </dd>
            </div>
        </div>

        {/* Order History */}
        <h2 class="text-lg font-medium text-gray-900 mb-4">Order History</h2>
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
                {orders.length === 0 ? (
                    <li class="px-4 py-4 text-gray-500 text-center">No orders yet</li>
                ) : orders.map(order => (
                    <li key={order.id}>
                        <a href={`/admin/orders/${order.id}`} class="block hover:bg-gray-50">
                            <div class="px-4 py-4 sm:px-6">
                                <div class="flex items-center justify-between">
                                    <p class="text-sm font-medium text-indigo-600 truncate">Order #{order.id.slice(0, 8)}...</p>
                                    <div class="ml-2 flex-shrink-0 flex">
                                        <p class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </p>
                                    </div>
                                </div>
                                <div class="mt-2 sm:flex sm:justify-between">
                                    <div class="sm:flex">
                                        <p class="flex items-center text-sm text-gray-500">
                                            {order.items.length} items
                                        </p>
                                        <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                            Total: ${order.total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Placed on <time datetime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </div>

      </div>
    </LayoutWrapper>
  );
};
