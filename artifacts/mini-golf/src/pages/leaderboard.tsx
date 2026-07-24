import { useGetGame, useGetLeaderboard, useCompleteGame, getGetGameQueryKey, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { GameTabs } from '@/components/game-tabs';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Leaderboard({ params }: { params: { gameId: string } }) {
  const gameId = parseInt(params.gameId, 10);
  const { data: game, isLoading: gameLoading } = useGetGame(gameId, { query: { enabled: !!gameId, queryKey: getGetGameQueryKey(gameId) } });
  const { data: leaderboard, isLoading: lbLoading } = useGetLeaderboard(gameId, { query: { enabled: !!gameId, queryKey: getGetLeaderboardQueryKey(gameId) } });
  const completeGame = useCompleteGame();
  const queryClient = useQueryClient();

  const handleComplete = () => {
    if (confirm('Are you sure you want to end this game? Scores will be locked.')) {
      completeGame.mutate(
        { gameId },
        {
          onSuccess: (updatedGame) => {
            queryClient.setQueryData(getGetGameQueryKey(gameId), updatedGame);
          },
        }
      );
    }
  };

  if (gameLoading || lbLoading || !game || !leaderboard)
    return <div className="p-8 text-center text-muted-foreground font-medium">Loading leaderboard...</div>;

  const par = game.par ?? 3;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
      <GameTabs gameId={gameId} />

      {game.completedAt && (
        <div className="mb-6 flex justify-center animate-in zoom-in duration-300">
          <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-5 py-2 rounded-full flex items-center gap-2 text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
            Game Complete
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-muted-foreground font-medium">Par {par} per hole • {game.holes} holes</p>
      </div>

      <div className="space-y-4">
        {leaderboard.map((entry, index) => {
          const expectedStrokes = entry.holesCompleted * par;
          const vsPar = entry.totalStrokes - expectedStrokes;
          const vsParText = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
          const vsParClass = vsPar === 0 ? 'text-muted-foreground' : vsPar < 0 ? 'text-primary' : 'text-destructive';

          return (
            <div key={entry.playerId} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group">
              {index === 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>}
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 flex items-center justify-center font-display font-black text-xl rounded-full bg-muted/50 text-muted-foreground">
                  {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/20" /> : index + 1}
                </div>
                <div>
                  <p className="font-display font-bold text-lg leading-tight">{entry.playerName}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {entry.holesCompleted} / {game.holes} holes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-display font-black text-primary tracking-tighter">{entry.totalStrokes}</div>
                <div className={`text-sm font-bold ${vsParClass}`}>{vsParText} vs par</div>
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-2xl font-medium">
            No scores recorded yet.
          </div>
        )}
      </div>

      {!game.completedAt && (
        <div className="mt-10">
          <button
            onClick={handleComplete}
            disabled={completeGame.isPending}
            className="w-full bg-secondary text-secondary-foreground font-display font-bold text-xl py-5 rounded-2xl shadow-[0_6px_0_0_#be185d] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#be185d] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {completeGame.isPending ? 'Completing...' : 'End Game'}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4 font-medium">Ending the game will lock all scores.</p>
        </div>
      )}
    </div>
  );
}
