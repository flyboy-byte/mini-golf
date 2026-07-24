import { useState, useRef, useEffect } from 'react';
import { useGetGame, useUpsertScore, getGetGameQueryKey, type GameDetail } from '@workspace/api-client-react';
import { GameTabs } from '@/components/game-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

function ScoreCell({ gameId, playerId, hole, currentScore, isComplete }: { gameId: number, playerId: number, hole: number, currentScore?: number, isComplete: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(currentScore?.toString() || '');
  const upsertScore = useUpsertScore();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
     setIsEditing(false);
     if (!val.trim()) {
        setVal(currentScore?.toString() || '');
        return;
     }
     const num = parseInt(val, 10);
     if (!isNaN(num) && num > 0) {
        if (num !== currentScore) {
            upsertScore.mutate({ gameId, data: { playerId, hole, strokes: num } }, {
               onSuccess: (newScore) => {
                  queryClient.setQueryData<GameDetail>(getGetGameQueryKey(gameId), (old) => {
                     if (!old) return old;
                     const scores = old.scores.filter(s => !(s.playerId === newScore.playerId && s.hole === newScore.hole));
                     return { ...old, scores: [...scores, newScore] };
                  });
               }
            });
        }
     } else {
        setVal(currentScore?.toString() || '');
     }
  };

  if (isEditing) {
     return (
       <input
         ref={inputRef}
         type="number"
         min="1"
         max="99"
         className="w-full h-full absolute inset-0 text-center bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-none font-black text-xl text-primary z-20 m-0 p-0"
         value={val}
         onChange={e => setVal(e.target.value)}
         onBlur={handleSave}
         onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
               setVal(currentScore?.toString() || '');
               setIsEditing(false);
            }
         }}
       />
     )
  }

  return (
     <button
       disabled={isComplete}
       className="w-full h-full min-h-[56px] flex items-center justify-center text-lg font-bold hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset disabled:opacity-80 disabled:hover:bg-transparent"
       onClick={() => setIsEditing(true)}
     >
       {currentScore ? (
         <span className="text-foreground font-display text-xl">{currentScore}</span>
       ) : (
         <span className="text-muted-foreground/30 font-medium">-</span>
       )}
     </button>
  );
}

export default function Scorecard({ params }: { params: { gameId: string } }) {
   const gameId = parseInt(params.gameId, 10);
   const { data: game, isLoading } = useGetGame(gameId, { query: { enabled: !!gameId, queryKey: getGetGameQueryKey(gameId) } });

   if (isLoading || !game) return <div className="p-8 text-center text-muted-foreground font-medium">Loading scorecard...</div>;

   const holes = Array.from({ length: game.holes }, (_, i) => i + 1);

   return (
     <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
        <GameTabs gameId={gameId} />

        <div className="mb-4">
           <h1 className="text-2xl font-display font-black tracking-tight">{game.name}</h1>
           <p className="text-sm text-muted-foreground font-medium">Scorecard • {game.holes} Holes</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm w-full">
           <table className="w-full text-sm text-left border-collapse">
             <thead className="bg-muted/50 text-muted-foreground font-display">
               <tr>
                 <th className="p-3 border-b border-r border-border sticky left-0 bg-muted/80 backdrop-blur-md z-10 font-bold w-16 text-center shadow-[1px_0_0_0_hsl(var(--border))]">
                   Hole
                 </th>
                 {game.players.map(p => (
                    <th key={p.id} className="p-3 border-b border-r border-border text-center font-bold min-w-[90px] whitespace-nowrap">
                      {p.name}
                    </th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {holes.map(hole => (
                 <tr key={hole} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                   <td className="p-3 border-r border-border sticky left-0 bg-card font-display font-bold text-center z-10 text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">
                      {hole}
                   </td>
                   {game.players.map(p => {
                      const score = game.scores.find(s => s.playerId === p.id && s.hole === hole);
                      return (
                        <td key={p.id} className="border-r border-border p-0 relative min-w-[90px]">
                           <ScoreCell gameId={game.id} playerId={p.id} hole={hole} currentScore={score?.strokes} isComplete={!!game.completedAt} />
                        </td>
                      )
                   })}
                 </tr>
               ))}
             </tbody>
             <tfoot className="bg-primary/5 font-display font-black">
                <tr>
                   <td className="p-3 border-r border-border sticky left-0 bg-primary/10 backdrop-blur-md z-10 text-center shadow-[1px_0_0_0_hsl(var(--border))] text-muted-foreground">
                     TOT
                   </td>
                   {game.players.map(p => {
                      const total = game.scores.filter(s => s.playerId === p.id).reduce((sum, s) => sum + s.strokes, 0);
                      return <td key={p.id} className="p-3 border-r border-border text-center text-primary text-xl">{total}</td>
                   })}
                </tr>
             </tfoot>
           </table>
        </div>

        {game.completedAt && (
           <div className="mt-8 p-4 bg-muted/50 border border-border rounded-xl text-center text-sm font-medium text-muted-foreground">
              This game is completed. Scores cannot be edited.
           </div>
        )}
     </div>
   )
}
