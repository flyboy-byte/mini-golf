import { useListGames, useDeleteGame, getListGamesQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Play, Trophy, Trash2, Calendar, Flag, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const { data: games, isLoading } = useListGames();
  const deleteGame = useDeleteGame();
  const queryClient = useQueryClient();

  const handleDelete = (e: React.MouseEvent, id: number) => {
     e.preventDefault();
     if (confirm('Are you sure you want to delete this game?')) {
        deleteGame.mutate({ gameId: id }, {
           onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() })
        });
     }
  };

  if (isLoading) return <div className="p-8 text-center font-medium text-muted-foreground">Loading course data...</div>;

  const activeGames = games?.filter(g => !g.completedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const completedGames = games?.filter(g => g.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()) || [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center space-y-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-inner border border-primary/20">
          <Flag className="w-10 h-10 text-primary fill-primary/20" />
        </div>
        <h1 className="text-4xl font-display font-black tracking-tight">Ready to putt?</h1>
        <p className="text-muted-foreground font-medium text-lg">Track your strokes, crush your friends.</p>
        <Link href="/games/new" className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-xl px-8 py-5 rounded-2xl shadow-[0_6px_0_0_#047857] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#047857] active:translate-y-[6px] active:shadow-none transition-all">
          <Play className="w-6 h-6 fill-current" />
          Start New Game
        </Link>
      </div>

      {activeGames.length > 0 && (
         <div className="space-y-4">
            <h2 className="font-bold uppercase tracking-wider text-muted-foreground text-sm">Active Games</h2>
            <div className="grid gap-3">
               {activeGames.map(game => (
                  <Link key={game.id} href={`/games/${game.id}`} className="block bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors group">
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="font-display font-bold text-xl">{game.name}</h3>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(game.createdAt), 'MMM d, yyyy')}
                              <span>•</span>
                              <span>{game.holes} Holes</span>
                           </div>
                        </div>
                        <button
                           onClick={(e) => handleDelete(e, game.id)}
                           className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                           title="Delete Game"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      )}

      {completedGames.length > 0 && (
         <div className="space-y-4 opacity-80">
            <h2 className="font-bold uppercase tracking-wider text-muted-foreground text-sm flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4" /> Completed
            </h2>
            <div className="grid gap-3">
               {completedGames.map(game => (
                  <Link key={game.id} href={`/games/${game.id}/leaderboard`} className="block bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors group">
                     <div className="flex justify-between items-center">
                        <div>
                           <h3 className="font-display font-bold text-lg">{game.name}</h3>
                           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                              {format(new Date(game.completedAt!), 'MMM d, yyyy')}
                           </div>
                        </div>
                        <Trophy className="w-5 h-5 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
