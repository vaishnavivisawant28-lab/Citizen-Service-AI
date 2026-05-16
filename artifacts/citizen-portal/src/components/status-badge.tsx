import { Badge } from "@/components/ui/badge";

type Status = "pending" | "approved" | "rejected" | "cancelled";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200">Rejected</Badge>;
    case "cancelled":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border border-gray-200">Cancelled</Badge>;
    case "pending":
    default:
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200">Pending</Badge>;
  }
}
