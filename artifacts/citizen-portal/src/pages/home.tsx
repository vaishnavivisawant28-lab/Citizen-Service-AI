import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, FileText, CheckCircle, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="h-16 px-6 lg:px-8 flex items-center border-b bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">CitizenConnect</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium bg-primary text-primary-foreground hover:bg-primary/90">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 lg:py-32 overflow-hidden bg-primary relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541886191437-0248f2178fc6?q=80&w=2938&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="container px-4 md:px-6 relative z-10 text-center text-white max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Government Services, <span className="text-accent">Simplified</span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-medium">
              Update your citizen profile, request document changes, and interact with our AI assistant for policy guidance—all in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold px-8 h-14">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white text-base font-semibold px-8 h-14">
                  Sign In to Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Secure, Transparent, Efficient
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Manage your government records with confidence. Our platform is built on modern security standards to protect your data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless Updates</h3>
                <p className="text-gray-600">
                  Update your mobile number, email, or address with just a few clicks. Track the status of your requests in real-time.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Verification</h3>
                <p className="text-gray-600">
                  OTP-based verification ensures that only you can authorize changes to your sensitive personal information.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Policy Assistant</h3>
                <p className="text-gray-600">
                  Have questions about policies or procedures? Our intelligent chatbot provides accurate answers guided by official documents.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-gray-900 text-gray-400 border-t border-gray-800 text-center text-sm">
        <div className="container px-4 md:px-6">
          <p>© {new Date().getFullYear()} Government Citizen Service Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
