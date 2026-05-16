import { useState } from "react";
import { useAdminListCitizens } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Loader2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminCitizens() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useAdminListCitizens({
    page,
    limit: 10,
    search: search || undefined,
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Citizens Directory</h1>
        <p className="text-gray-500 mt-1">Browse and search registered citizens</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, email, or Aadhaar..." 
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data?.citizens.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No citizens found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Aadhaar (Masked)</th>
                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.citizens.map((citizen) => (
                    <tr key={citizen.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {citizen.fullName}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 tracking-wider">
                        {citizen.aadhaarNumber ? `XXXX-XXXX-${citizen.aadhaarNumber.slice(-4)}` : "Not Available"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{citizen.email || <span className="text-gray-400 italic">No email</span>}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{citizen.mobileNumber || <span className="text-gray-400 italic">No mobile</span>}</div>
                      </td>
                      <td className="px-6 py-4">
                        {citizen.role === 'admin' ? (
                          <Badge className="bg-primary text-white hover:bg-primary border-transparent">
                            <Shield className="h-3 w-3 mr-1" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">Citizen</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(citizen.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data && data.total > data.limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} citizens
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
    </div>
  );
}
