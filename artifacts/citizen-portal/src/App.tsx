import React, { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useAuth, useUser, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSyncMyProfile } from "@workspace/api-client-react";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import RequestsList from "@/pages/requests/list";
import NewRequest from "@/pages/requests/new";
import RequestDetail from "@/pages/requests/detail";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminRequests from "@/pages/admin/requests";
import AdminCitizens from "@/pages/admin/citizens";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(221 83% 30%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-gray-200 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-semibold text-gray-900",
    headerSubtitle: "text-sm text-gray-500",
    socialButtonsBlockButtonText: "font-medium text-gray-700",
    formFieldLabel: "text-sm font-medium text-gray-700",
    footerActionLink: "text-primary font-medium hover:underline",
    footerActionText: "text-gray-500 text-sm",
    dividerText: "text-gray-400 text-xs uppercase bg-white px-2",
    identityPreviewEditButton: "text-primary hover:bg-gray-50",
    formFieldSuccessText: "text-emerald-600 text-xs",
    alertText: "text-sm",
    logoBox: "h-12 flex justify-center mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 bg-white",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium",
    formFieldInput: "border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900",
    footerAction: "bg-gray-50 border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "border-l-4",
    otpCodeFieldInput: "border-gray-300 text-gray-900",
    formFieldRow: "mb-4",
    main: "px-8 py-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return null;
  
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ProfileSyncManager() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const syncProfile = useSyncMyProfile();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !hasSynced.current) {
      hasSynced.current = true;
      syncProfile.mutate({
        data: {
          fullName: user.fullName || "Citizen",
          email: user.primaryEmailAddress?.emailAddress || null,
        }
      });
    }
  }, [isLoaded, isSignedIn, user, syncProfile]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ProfileSyncManager />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/requests"><ProtectedRoute component={RequestsList} /></Route>
          <Route path="/requests/new"><ProtectedRoute component={NewRequest} /></Route>
          <Route path="/requests/:id"><ProtectedRoute component={RequestDetail} /></Route>
          
          <Route path="/admin"><ProtectedRoute component={AdminDashboard} /></Route>
          <Route path="/admin/requests"><ProtectedRoute component={AdminRequests} /></Route>
          <Route path="/admin/citizens"><ProtectedRoute component={AdminCitizens} /></Route>
          <Route path="/admin/audit-logs"><ProtectedRoute component={AdminAuditLogs} /></Route>
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
