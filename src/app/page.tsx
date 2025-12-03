import { getDashboardStats } from "./actions";
import { Users, DollarSign, ShoppingCart } from "lucide-react";

export default async function Dashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold">{stats.ordersCount}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="text-2xl font-bold">{stats.usersCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="p-3 font-medium text-slate-500">Order ID</th>
                <th className="p-3 font-medium text-slate-500">Customer</th>
                <th className="p-3 font-medium text-slate-500">Date</th>
                <th className="p-3 font-medium text-slate-500">Status</th>
                <th className="p-3 font-medium text-slate-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order: any) => (
                <tr key={order.order_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-mono text-sm">{order.order_id}</td>
                  <td className="p-3">{order.name}</td>
                  <td className="p-3 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                      {order.order_status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">${order.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
