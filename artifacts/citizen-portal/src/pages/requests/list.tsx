import { useState } from "react";
import { Link } from "wouter";
import { useListMyRequests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestsList() {
  const { data: requests, isLoading } = useListMyRequests();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredRequests = requests?.filter(req => {
    if (filter !== "all" && req.status !== filter) return false;
    if (search && !req.fieldName.replace('_', ' ').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 mt-1">Track and manage your profile update requests</p>
        </div>
        <Link href="/requests/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search requests..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredRequests?.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Request ID</th>
                  <th className="px-6 py-4 font-semibold">Update Type</th>
                  <th className="px-6 py-4 font-semibold">Date Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests?.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">#{req.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                      {req.fieldName.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status as any} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/requests/${req.id}`}>
                        <Button variant="ghost" size="sm" className="font-medium text-primary hover:text-primary/80">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
