import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Activity } from "lucide-react";

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useListAuditLogs({
    page,
    limit: 15,
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500 mt-1">Immutable record of system activity and administrative actions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data?.logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">Admin / System</th>
                    <th className="px-6 py-4 font-semibold">Target Record</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.action.includes('approve') ? 'bg-emerald-100 text-emerald-800' :
                          log.action.includes('reject') ? 'bg-red-100 text-red-800' :
                          log.action.includes('create') ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-900 font-medium">
                        {log.adminId ? `Admin (${log.adminId})` : 'System / Self'}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {log.targetField ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-gray-400">User ID</span>
                            <span className="font-mono">{log.userId || 'N/A'}</span>
                            <span className="text-xs uppercase tracking-wider text-gray-400 ml-2">Field</span>
                            <span className="font-mono">{log.targetField}</span>
                          </div>
                        ) : (
                          `User ID: ${log.userId || 'N/A'}`
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={log.details || ''}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data && data.total > data.limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} logs
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Newer</Button>
                  <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Older</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
