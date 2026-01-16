import { getActionLogs, getAuthLogs } from "../actions";
import Link from "next/link";
import { 
  User, Trash2, Edit, Plus, FileJson, 
  ShieldAlert, ShieldCheck, LogIn, LogOut, Lock, Activity, Filter, Database 
} from "lucide-react";

export default async function ActionLogsPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const resolvedParams = await searchParams;
  const filterType = resolvedParams.type || 'all'; 

  const [actionLogs, authLogs] = await Promise.all([
    (filterType === 'all' || filterType === 'actions') ? getActionLogs(50) : [],
    (filterType === 'all' || filterType === 'auth') ? getAuthLogs(50) : []
  ]);

  const combinedLogs = [
    ...actionLogs.map((l: any) => ({ ...l, log_type: 'action' })),
    ...authLogs.map((l: any) => ({ ...l, log_type: 'auth' }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getBadgeStyle = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DELETE': return 'bg-red-50 text-red-700 border-red-100';
      case 'LOGIN': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'LOGOUT': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'FAILED_LOGIN': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-3 h-3" />;
      case 'UPDATE': return <Edit className="w-3 h-3" />;
      case 'DELETE': return <Trash2 className="w-3 h-3" />;
      case 'LOGIN': return <LogIn className="w-3 h-3" />;
      case 'LOGOUT': return <LogOut className="w-3 h-3" />;
      case 'FAILED_LOGIN': return <ShieldAlert className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Action Logs</h1>
          <p className="text-gray-500 mt-1">Track system actions and security events.</p>
        </div>

        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50 self-start md:self-auto">
          <Link 
            href="/action?type=all" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            All Logs
          </Link>
          <Link 
            href="/action?type=actions" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'actions' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <FileJson className="w-4 h-4" /> Data Actions
          </Link>
          <Link 
            href="/action?type=auth" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'auth' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Auth
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actor</th>
                <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Type</th>
                <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {combinedLogs.length > 0 ? (
                combinedLogs.map((log: any) => {
                  const isAuth = log.log_type === 'auth';
                  const actionName = isAuth ? log.event_type : log.action;

                  return (
                    <tr key={`${log.log_type}_${log.log_id}`} className="group hover:bg-gray-50/50 transition-colors">
                      
                      <td className="p-5 whitespace-nowrap w-48">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-5 whitespace-nowrap w-56">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-gray-500 ${isAuth ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                             {isAuth ? <Lock className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                              <div className="text-sm font-medium text-gray-900">
                                  {log.admin_name || 'System'}
                              </div>
                              <div className="text-xs text-gray-400">
                                  {log.performed_by === 'System' ? 'Automated' : (log.admin_email || 'Unknown')}
                              </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 w-48">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(actionName)}`}>
                          {getIcon(actionName)}
                          {actionName}
                        </span>
                      </td>

                      <td className="p-5">
                        {isAuth ? (
                           <div>
                             <div className="text-sm font-medium text-gray-900">{log.details || 'No details'}</div>
                             <div className="text-xs text-gray-400 font-mono mt-0.5">IP: {log.ip_address || 'Unknown'} • {log.user_agent ? 'Browser' : 'System'}</div>
                           </div>
                        ) : (
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                 <Database className="w-3 h-3" /> {log.table_name} <span className="text-gray-300">|</span> ID: {log.record_id}
                              </div>
                              
                              <div className="text-xs space-y-1">
                                {log.old_values && (
                                    <div className="flex gap-2 bg-red-50/50 p-1.5 rounded-lg border border-red-100/50">
                                        <span className="font-bold text-red-500 w-8 shrink-0">OLD</span>
                                        <span className="text-gray-600 truncate font-mono max-w-md">
                                            {log.old_values.substring(0, 80)}...
                                        </span>
                                    </div>
                                )}
                                {log.new_values && (
                                    <div className="flex gap-2 bg-green-50/50 p-1.5 rounded-lg border border-green-100/50">
                                        <span className="font-bold text-green-600 w-8 shrink-0">NEW</span>
                                        <span className="text-gray-700 truncate font-mono max-w-md">
                                            {log.new_values.substring(0, 80)}...
                                        </span>
                                    </div>
                                )}
                              </div>
                           </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">No logs found</p>
                    <p className="text-sm mt-1">There are no actions to display.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
