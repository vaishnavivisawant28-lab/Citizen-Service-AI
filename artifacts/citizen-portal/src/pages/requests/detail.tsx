import { useParams, Link } from "wouter";
import { useGetRequest, useCancelRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Ban, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetRequestQueryKey } from "@workspace/api-client-react";

export default function RequestDetail() {
  const { id } = useParams();
  const requestId = parseInt(id || "0");
  const { data: request, isLoading } = useGetRequest(requestId, { query: { enabled: !!requestId, queryKey: getGetRequestQueryKey(requestId) } });
  const cancelMutation = useCancelRequest();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-gray-500">Request not found.</div>;
  }

  const handleCancel = () => {
    cancelMutation.mutate({ id: requestId }, {
      onSuccess: (data) => {
        toast({ title: "Request Cancelled", description: "Your update request has been cancelled." });
        queryClient.setQueryData(getGetRequestQueryKey(requestId), data);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to cancel request", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Request #{request.id.toString().padStart(4, '0')}</h1>
            <StatusBadge status={request.status as any} />
          </div>
          <p className="text-gray-500 mt-1">Submitted on {format(new Date(request.createdAt), 'MMMM d, yyyy')}</p>
        </div>
        
        {request.status === 'pending' && (
          <div className="ml-auto">
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Cancel Request
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg">Update Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Field to Update</p>
                <p className="text-base font-medium text-gray-900 capitalize">{request.fieldName.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-base font-medium text-gray-900">{format(new Date(request.updatedAt), 'MMMM d, yyyy HH:mm')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Value</p>
                <p className="text-gray-600 font-mono text-sm break-words">
                  {request.oldValue || <span className="italic text-gray-400">Not set previously</span>}
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Requested Value</p>
                <p className="text-gray-900 font-mono text-sm font-medium break-words">
                  {request.newValue}
                </p>
              </div>
            </div>

            {request.adminNote && (
              <div className={`p-4 rounded-lg border ${
                request.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                request.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Administrator Note</p>
                <p className="text-sm">{request.adminNote}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
