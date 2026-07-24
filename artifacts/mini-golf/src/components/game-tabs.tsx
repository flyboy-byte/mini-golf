import { Link, useRoute } from 'wouter';
import { cn } from '@/lib/utils';
import { LayoutGrid, Trophy } from 'lucide-react';

export function GameTabs({ gameId }: { gameId: number }) {
   const [isScorecard] = useRoute('/games/:gameId');
   const [isLeaderboard] = useRoute('/games/:gameId/leaderboard');

   return (
     <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl mb-6 border border-border">
        <Link href={`/games/${gameId}`} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold transition-all text-sm", isScorecard ? "bg-card shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-black/5")}>
           <LayoutGrid className="w-4 h-4" /> Scorecard
        </Link>
        <Link href={`/games/${gameId}/leaderboard`} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold transition-all text-sm", isLeaderboard ? "bg-card shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-black/5")}>
           <Trophy className="w-4 h-4" /> Leaderboard
        </Link>
     </div>
   )
}
