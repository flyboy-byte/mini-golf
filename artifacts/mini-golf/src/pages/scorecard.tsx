import { useState } from 'react';
import { useGetGame, useUpsertScore, getGetGameQueryKey, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { GameTabs } from '@/components/game-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, CheckCircle2 } from 'lucide-react';

function ScoreStepper({
  gameId,
  playerId,
  hole,
  par,
  currentScore,
  isComplete,
}: {
  gameId: number;
  playerId: number;
  hole: number;
  par: number;
  currentScore?: number;
  isComplete: boolean;
}) {
  const upsertScore = useUpsertScore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<number | undefined>(currentScore);

  const save = async (next: number) => {
    if (next < 1) return;
    setDraft(next);
    await upsertScore.mutateAsync({ gameId, data: { playerId, hole, strokes: next } });
    queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(gameId) });
    queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey(gameId) });
  };

  const displayed = draft ?? currentScore ?? 0;

  // First tap (in either direction) starts the score at par, like uDisc —
  // only once a score exists do +/- step by a single stroke from there.
  const handleMinus = () => save(displayed === 0 ? par : Math.max(1, displayed - 1));
  const handlePlus = () => save(displayed === 0 ? par : displayed + 1);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        disabled={isComplete || displayed === 1}
        onClick={handleMinus}
        className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-foreground disabled:opacity-40 active:scale-95 transition-transform"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={99}
        disabled={isComplete}
        value={displayed || ''}
        onChange={(e) => {
          const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
          if (val === undefined || (!isNaN(val) && val >= 0 && val <= 99)) {
            setDraft(val);
          }
        }}
        onBlur={() => {
          if (draft !== undefined && draft !== currentScore && draft >= 1) {
            save(draft);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-12 h-10 text-center font-display font-bold text-xl bg-card border-2 border-border rounded-lg focus:border-primary focus:outline-none disabled:opacity-60"
      />
      <button
        disabled={isComplete}
        onClick={handlePlus}
        className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-foreground disabled:opacity-40 active:scale-95 transition-transform"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Scorecard({ params }: { params: { gameId: string } }) {
  const gameId = parseInt(params.gameId, 10);
  const { data: game, isLoading } = useGetGame(gameId, {
    query: { enabled: !!gameId, queryKey: getGetGameQueryKey(gameId), refetchInterval: 10000 },
  });

  if (isLoading || !game) return <div className="p-8 text-center text-muted-foreground font-medium">Loading scorecard...</div>;

  const holes = Array.from({ length: game.holes }, (_, i) => i + 1);
  const par = game.par ?? 3;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
      <GameTabs gameId={gameId} />

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight">{game.name}</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Scorecard • {game.holes} Holes • Par {par}
          </p>
        </div>
        {game.completedAt && (
          <div className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </div>
        )}
      </div>

      <div className="space-y-3">
        {holes.map((hole) => (
          <div key={hole} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-display font-bold flex items-center justify-center">
                  {hole}
                </span>
                <span className="text-sm font-medium text-muted-foreground">Par {par}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {game.players.map((p) => {
                const score = game.scores.find((s) => s.playerId === p.id && s.hole === hole);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <span className="font-bold text-foreground truncate pr-2">{p.name}</span>
                    <ScoreStepper
                      gameId={game.id}
                      playerId={p.id}
                      hole={hole}
                      par={par}
                      currentScore={score?.strokes}
                      isComplete={!!game.completedAt}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {game.completedAt && (
        <div className="mt-6 p-4 bg-muted/50 border border-border rounded-xl text-center text-sm font-medium text-muted-foreground">
          This game is completed. Scores cannot be edited.
        </div>
      )}
    </div>
  );
}
