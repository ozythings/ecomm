import { getDashboardStats } from "./actions";
import { Users, DollarSign, ShoppingBag, ArrowUpRight, Crown, Activity } from "lucide-react";

export default async function Dashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">Overview</h1>
          <p className="text-gray-500 mt-1 text-lg">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm text-gray-600 border border-gray-100">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Section - Apple Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          trend="+12.5%"
          color="bg-black"
        />
        <KpiCard
          title="Total Orders"
          value={stats.ordersCount.toLocaleString()}
          icon={<ShoppingBag className="w-6 h-6 text-white" />}
          trend="+4.3%"
          color="bg-blue-600"
        />
        <KpiCard
          title="Active Users"
          value={stats.usersCount.toLocaleString()}
          icon={<Users className="w-6 h-6 text-white" />}
          trend="+8.1%"
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Orders - Minimalist Table */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Orders</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-4 pl-2">Customer</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.order_id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="font-medium text-gray-900">{order.name}</div>
                      <div className="text-xs text-gray-400">ID: {order.order_id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900 pr-2">
                      ${order.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIP Customers - Highlight Card */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <Crown className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">VIP Customers</h2>
              <p className="text-sm text-gray-500">High-value clients (more than $500)</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {stats.topSpenders.length > 0 ? (
              stats.topSpenders.map((user: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7] group hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-gray-400 shadow-sm text-sm group-hover:text-amber-600 transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.order_count} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${user.total_spent.toFixed(2)}</div>
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Lifetime</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No VIP customers found yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Components for Aesthetic Consistency ---

function KpiCard({ title, value, icon, trend, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start z-10">
        <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-${color}/20 transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <div className="z-10">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    completed: "bg-green-100 text-green-700 border-green-200",
    processing: "bg-blue-50 text-blue-700 border-blue-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  const defaultStyle = "bg-gray-50 text-gray-600 border-gray-200";
  const activeStyle = styles[status.toLowerCase()] || defaultStyle;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${activeStyle} capitalize`}>
      {status}
    </span>
  );
}
