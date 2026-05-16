import { useAdminGetStats, useAdminListRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Citizens</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalCitizens || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalRequests || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.pendingRequests || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.approvedRequests || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats?.rejectedRequests || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b border-gray-100 pb-4 pt-4">
          <CardTitle className="text-lg">Needs Attention</CardTitle>
          <Link href="/admin/requests?status=pending">
            <Button variant="outline" size="sm">View All Pending</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
              <p>Inbox zero. All requests have been processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Citizen</th>
                    <th className="px-6 py-3 font-medium">Update Type</th>
                    <th className="px-6 py-3 font-medium">Requested On</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentActivity.slice(0, 10).map(req => (
                    <tr key={req.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-gray-900">{req.citizenName}</td>
                      <td className="px-6 py-3 capitalize text-gray-600">{req.fieldName.replace('_', ' ')}</td>
                      <td className="px-6 py-3 text-gray-500">{format(new Date(req.createdAt), 'MMM d, yyyy')}</td>
                      <td className="px-6 py-3"><StatusBadge status={req.status as any} /></td>
                      <td className="px-6 py-3 text-right">
                        <Link href={`/admin/requests`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">Review</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
