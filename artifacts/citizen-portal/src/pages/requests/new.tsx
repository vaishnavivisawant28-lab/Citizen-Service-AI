import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateRequest, useSendOtp, useVerifyOtp, UpdateRequestInputFieldName } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fieldName, setFieldName] = useState<UpdateRequestInputFieldName | "">("");
  const [newValue, setNewValue] = useState("");
  
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const createRequest = useCreateRequest();

  const needsOtp = fieldName === UpdateRequestInputFieldName.mobile_number || fieldName === UpdateRequestInputFieldName.email;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !newValue) return;

    if (needsOtp) {
      const otpType = fieldName === UpdateRequestInputFieldName.mobile_number ? 'mobile' : 'email';
      sendOtp.mutate({
        data: { type: otpType, value: newValue }
      }, {
        onSuccess: () => {
          setStep(2);
          toast({ title: "OTP Sent", description: `Verification code sent to ${newValue}` });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
        }
      });
    } else {
      setStep(3); // Skip OTP for address
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    const otpType = fieldName === UpdateRequestInputFieldName.mobile_number ? 'mobile' : 'email';
    verifyOtp.mutate({
      data: { type: otpType, value: newValue, code: otpCode }
    }, {
      onSuccess: (res) => {
        if (res.valid && res.token) {
          setOtpToken(res.token);
          setStep(3);
          toast({ title: "Verified", description: "Verification successful." });
        } else {
          toast({ title: "Verification Failed", description: res.message, variant: "destructive" });
        }
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to verify OTP", variant: "destructive" });
      }
    });
  };

  const handleFinalSubmit = () => {
    if (!fieldName || !newValue) return;
    
    createRequest.mutate({
      data: {
        fieldName: fieldName as UpdateRequestInputFieldName,
        newValue,
        otpToken: otpToken
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Request submitted successfully." });
        setLocation("/requests");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Update Request</h1>
          <p className="text-gray-500 mt-1">Submit a request to update your citizen profile</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
      </div>

      <Card className="border-gray-200 shadow-sm">
        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <CardHeader>
              <CardTitle>Select Field to Update</CardTitle>
              <CardDescription>Choose which information you want to change.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Field</Label>
                <Select value={fieldName} onValueChange={(v) => setFieldName(v as UpdateRequestInputFieldName)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UpdateRequestInputFieldName.mobile_number}>Mobile Number</SelectItem>
                    <SelectItem value={UpdateRequestInputFieldName.email}>Email Address</SelectItem>
                    <SelectItem value={UpdateRequestInputFieldName.address}>Residential Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fieldName && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label>New Value</Label>
                  {fieldName === UpdateRequestInputFieldName.address ? (
                    <textarea 
                      className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter new address..."
                      required
                    />
                  ) : (
                    <Input 
                      type={fieldName === UpdateRequestInputFieldName.email ? "email" : "tel"}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={`Enter new ${fieldName.replace('_', ' ')}`}
                      required
                    />
                  )}
                  {needsOtp && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                      This field requires OTP verification before submission.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={!fieldName || !newValue || sendOtp.isPending}>
                {sendOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <CardHeader>
              <CardTitle>Verify New Information</CardTitle>
              <CardDescription>
                We've sent a verification code to <strong>{newValue}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" disabled={!otpCode || verifyOtp.isPending}>
                {verifyOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <div>
            <CardHeader>
              <CardTitle>Confirm Request</CardTitle>
              <CardDescription>Please review the details below before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm text-gray-500 font-medium">Field</div>
                  <div className="col-span-2 text-sm font-semibold capitalize">{fieldName.replace('_', ' ')}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm text-gray-500 font-medium">New Value</div>
                  <div className="col-span-2 text-sm font-medium text-primary break-words">{newValue}</div>
                </div>
                {needsOtp && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="col-span-1 text-sm text-gray-500 font-medium">Verification</div>
                    <div className="col-span-2 text-sm font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(needsOtp ? 2 : 1)}>Back</Button>
              <Button onClick={handleFinalSubmit} disabled={createRequest.isPending}>
                {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
