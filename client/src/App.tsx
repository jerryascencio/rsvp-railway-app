import { useEffect, useState } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language";
import { api, restoreAuthToken } from "@/lib/api";
import { isLegacyHostname, setSiteContext } from "@/lib/event-scope";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Landing from "@/pages/landing";
import Wizard from "@/pages/wizard";
import EventSite from "@/pages/event-site";
import SuperAdmin from "@/pages/super-admin";
import { CheckoutSuccess, CheckoutCancel } from "@/pages/checkout";

type SiteInfo = {
  mode: "legacy" | "custom" | "platform";
  slug: string | null;
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          {children}
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function LegacyApp() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function EventRoute({ params }: { params: { slug: string } }) {
  setSiteContext({ slug: params.slug, mode: "platform", legacyCopy: false });
  return <EventSite slug={params.slug} />;
}

function EventAdminRoute({ params }: { params: { slug: string } }) {
  setSiteContext({ slug: params.slug, mode: "platform", legacyCopy: params.slug === "leah" });
  restoreAuthToken();
  return <Admin />;
}

function PlatformRoutes() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/start" component={Wizard} />
        <Route path="/e/:slug/admin" component={EventAdminRoute} />
        <Route path="/e/:slug" component={EventRoute} />
        <Route path="/super" component={SuperAdmin} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function CustomDomainApp({ slug }: { slug: string }) {
  setSiteContext({ slug, mode: "custom", legacyCopy: false });
  restoreAuthToken();
  return (
    <Router>
      <Switch>
        <Route path="/" component={() => <EventSite slug={slug} />} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(28_60%_96%)]">
      <p className="font-script text-4xl text-[hsl(346_37%_56%)]">Invitation</p>
    </div>
  );
}

/** Leah's domain root keeps the original hash app. Everything else asks the server. */
function isLeahRootPath() {
  const path = window.location.pathname;
  return isLegacyHostname() && (path === "/" || path === "");
}

function Routed() {
  const [site, setSite] = useState<SiteInfo | "legacy-root" | null>(
    isLeahRootPath() ? "legacy-root" : null,
  );

  useEffect(() => {
    if (isLeahRootPath()) return;
    api<SiteInfo>("GET", "/api/site")
      .then(setSite)
      .catch(() => setSite({ mode: "platform", slug: null }));
  }, []);

  if (site === "legacy-root" || site?.mode === "legacy") return <LegacyApp />;
  if (!site) return <Splash />;
  if (site.mode === "custom" && site.slug) return <CustomDomainApp slug={site.slug} />;
  return <PlatformRoutes />;
}

function App() {
  return (
    <Providers>
      <Routed />
    </Providers>
  );
}

export default App;
