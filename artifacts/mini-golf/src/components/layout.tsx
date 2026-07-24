import { Link } from 'wouter';
import { Flag } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col font-sans selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground font-display font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl rotate-3 shadow-sm">
              <Flag className="w-5 h-5 fill-current" />
            </div>
            Mini Golf Scorer
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
