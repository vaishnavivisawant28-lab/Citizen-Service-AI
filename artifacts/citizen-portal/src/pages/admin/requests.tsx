import { useState } from "react";
import { useAdminListRequests, useAdminApproveRequest, useAdminRejectRequest, getAdminListRequestsQueryKey, getAdminGetStatsQueryKey, AdminListRequestsStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminRequests() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminListRequestsStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminListRequests({
    page,
    limit: 10,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const approveMutation = useAdminApproveRequest();
  const rejectMutation = useAdminRejectRequest();

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    const isApprove = actionType === "approve";
    const mutation = isApprove ? approveMutation : rejectMutation;

    mutation.mutate({
      id: selectedRequest.id,
      data: { adminNote: adminNote || null }
    }, {
      onSuccess: () => {
        toast({ 
          title: `Request ${isApprove ? 'Approved' : 'Rejected'}`,
          description: `Successfully processed request #${selectedRequest.id}`,
        });
        setSelectedRequest(null);
        setActionType(null);
        setAdminNote("");
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: getAdminListRequestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (err) => {
        toast({ 
          title: "Error",
          description: err.message || "Failed to process request",
          variant: "destructive"
        });
      }
    });
  };

  const openDialog = (req: any, type: "approve" | "reject") => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNote("");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
        <p className="text-gray-500 mt-1">Review and process citizen profile update requests</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by citizen name..." 
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={(v) => {
            setStatus(v as any);
            setPage(1);
          }}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AdminListRequestsStatus.pending}>Pending</SelectItem>
              <SelectItem value={AdminListRequestsStatus.approved}>Approved</SelectItem>
              <SelectItem value={AdminListRequestsStatus.rejected}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data?.requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID / Date</th>
                    <th className="px-6 py-4 font-semibold">Citizen</th>
                    <th className="px-6 py-4 font-semibold">Update Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-gray-900">#{req.id.toString().padStart(4, '0')}</div>
                        <div className="text-xs text-gray-500 mt-1">{format(new Date(req.createdAt), 'MMM d, yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {req.citizenName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="capitalize font-medium text-gray-700 mb-1">
                          {req.fieldName.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={req.newValue}>
                          <span className="line-through opacity-70">{req.oldValue || 'none'}</span> 
                          <span className="mx-2">→</span> 
                          <span className="text-primary font-medium">{req.newValue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status as any} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => openDialog(req, 'approve')}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => openDialog(req, 'reject')}>
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data && data.total > data.limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} requests
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `You are about to approve the ${selectedRequest?.fieldName.replace('_', ' ')} update for ${selectedRequest?.citizenName}.` 
                : `You are about to reject the request from ${selectedRequest?.citizenName}.`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="my-4 p-4 bg-gray-50 rounded-md text-sm border border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-500">Field:</div>
                <div className="col-span-2 font-medium capitalize">{selectedRequest.fieldName.replace('_', ' ')}</div>
                
                <div className="text-gray-500">Current:</div>
                <div className="col-span-2 line-through text-gray-400">{selectedRequest.oldValue || 'None'}</div>
                
                <div className="text-gray-500">Requested:</div>
                <div className="col-span-2 font-medium text-primary">{selectedRequest.newValue}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Administrator Note (Optional)</label>
            <Textarea 
              placeholder="Add a note to explain this decision to the citizen..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button 
              className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              onClick={handleAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
