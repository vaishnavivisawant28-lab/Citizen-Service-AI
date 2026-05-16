import { useGetMyProfile, useGetCitizenDashboardStats, useListMyRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { data: stats, isLoading: statsLoading } = useGetCitizenDashboardStats();
  const { data: requests, isLoading: requestsLoading } = useListMyRequests();

  if (profileLoading || statsLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your profile and recent activity</p>
        </div>
        <Link href="/requests/new"><Button>New Update Request</Button></Link>
      </div>

      <Card className="bg-primary text-primary-foreground border-0 shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/4">
          <svg width="300" height="300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="20" fill="currentColor"/>
            <path d="M50 15L25 25V45C25 65 35 80 50 85C65 80 75 65 75 45V25L50 15Z" fill="white"/>
          </svg>
        </div>
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="text-2xl">Welcome back, {profile?.fullName}</CardTitle>
          <CardDescription className="text-primary-foreground/80 flex items-center font-mono mt-1">
            <ShieldIcon className="w-4 h-4 mr-2" /> Aadhaar: {profile?.aadhaarNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="bg-primary-foreground/10 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm backdrop-blur-sm">
            <div>
              <span className="opacity-70 block mb-1 text-xs uppercase tracking-wider font-semibold">Mobile Number</span>
              <span className="font-medium text-lg">{profile?.mobileNumber || "Not provided"}</span>
            </div>
            <div>
              <span className="opacity-70 block mb-1 text-xs uppercase tracking-wider font-semibold">Email Address</span>
              <span className="font-medium text-lg">{profile?.email || "Not provided"}</span>
            </div>
            <div>
              <span className="opacity-70 block mb-1 text-xs uppercase tracking-wider font-semibold">Registered Address</span>
              <span className="font-medium text-lg">{profile?.address || "Not provided"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalRequests || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.pendingRequests || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats?.approvedRequests || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.rejectedRequests || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <CardTitle>Recent Requests</CardTitle>
          <Link href="/requests"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          {requestsLoading ? (
            <div className="p-6"><Skeleton className="h-40 w-full" /></div>
          ) : requests && requests.length > 0 ? (
            <div className="divide-y divide-border/50">
              {requests.slice(0, 5).map(req => (
                <div key={req.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-semibold text-sm capitalize">Update {req.fieldName.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Requested on {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={req.status} />
                    <Link href={`/requests/${req.id}`}>
                      <Button variant="outline" size="sm">Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-base font-medium">No requests found</p>
              <p className="text-sm mt-1 mb-4">You haven't submitted any profile update requests yet.</p>
              <Link href="/requests/new"><Button size="sm">Create Request</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
