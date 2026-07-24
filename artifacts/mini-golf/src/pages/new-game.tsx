import { useState } from 'react';
import { useCreateGame, useAddPlayer, GameInputHoles } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { ArrowRight, Trash2, Plus } from 'lucide-react';

export default function NewGame() {
   const [name, setName] = useState('');
   const [holes, setHoles] = useState<number>(GameInputHoles.NUMBER_9);
   const [players, setPlayers] = useState([{ id: 1, name: '' }, { id: 2, name: '' }]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [, setLocation] = useLocation();

   const createGame = useCreateGame();
   const addPlayer = useAddPlayer();

   const handleAddPlayer = () => {
      if (players.length >= 8) return;
      setPlayers([...players, { id: Date.now(), name: '' }]);
   };

   const handleRemovePlayer = (id: number) => {
      if (players.length <= 2) return;
      setPlayers(players.filter(p => p.id !== id));
   };

   const handlePlayerNameChange = (id: number, val: string) => {
      setPlayers(players.map(p => p.id === id ? { ...p, name: val } : p));
   };

   const handleSubmit = async () => {
      const validPlayers = players.filter(p => p.name.trim() !== '');
      if (validPlayers.length < 1 || !name.trim()) return;

      setIsSubmitting(true);
      try {
         const game = await createGame.mutateAsync({
            data: {
               name: name.trim(),
               holes: holes === 18 ? GameInputHoles.NUMBER_18 : GameInputHoles.NUMBER_9
            }
         });

         for (const p of validPlayers) {
            await addPlayer.mutateAsync({
               gameId: game.id,
               data: { name: p.name.trim() }
            });
         }

         setLocation(`/games/${game.id}`);
      } catch (e) {
         console.error(e);
         setIsSubmitting(false);
      }
   };

   const isValid = name.trim().length > 0 && players.filter(p => p.name.trim().length > 0).length >= 1;

   return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 space-y-8">
         <div>
            <h1 className="text-3xl font-display font-black tracking-tight mb-2">New Game</h1>
            <p className="text-muted-foreground font-medium">Set up the course and players.</p>
         </div>

         <div className="space-y-6">
            <div className="space-y-3">
               <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Course Name</label>
               <input
                  type="text"
                  placeholder="e.g. Pirate's Cove"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-4 bg-card border-2 border-border rounded-2xl font-bold text-lg focus:outline-none focus:border-primary focus:ring-0 transition-colors"
               />
            </div>

            <div className="space-y-3">
               <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Holes</label>
               <div className="flex gap-3">
                  <button
                     onClick={() => setHoles(9)}
                     className={`flex-1 py-4 rounded-2xl font-display font-bold text-lg border-2 transition-all ${holes === 9 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/50'}`}
                  >
                     9 Holes
                  </button>
                  <button
                     onClick={() => setHoles(18)}
                     className={`flex-1 py-4 rounded-2xl font-display font-bold text-lg border-2 transition-all ${holes === 18 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/50'}`}
                  >
                     18 Holes
                  </button>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span>Players ({players.length}/8)</span>
               </label>
               <div className="space-y-3">
                  {players.map((p, i) => (
                     <div key={p.id} className="flex gap-2 animate-in slide-in-from-left-2">
                        <div className="flex-1 relative">
                           <input
                              type="text"
                              placeholder={`Player ${i + 1}`}
                              value={p.name}
                              onChange={e => handlePlayerNameChange(p.id, e.target.value)}
                              className="w-full px-4 py-4 bg-card border-2 border-border rounded-2xl font-bold focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                           />
                        </div>
                        {players.length > 2 && (
                           <button
                              onClick={() => handleRemovePlayer(p.id)}
                              className="px-4 bg-destructive/10 text-destructive rounded-2xl border-2 border-transparent hover:bg-destructive/20 transition-colors"
                              title="Remove Player"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        )}
                     </div>
                  ))}
               </div>
               {players.length < 8 && (
                  <button
                     onClick={handleAddPlayer}
                     className="w-full py-4 border-2 border-dashed border-border rounded-2xl font-bold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                     <Plus className="w-5 h-5" />
                     Add Player
                  </button>
               )}
            </div>
         </div>

         <div className="pt-4">
            <button
               onClick={handleSubmit}
               disabled={!isValid || isSubmitting}
               className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-xl py-5 rounded-2xl shadow-[0_6px_0_0_#047857] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#047857] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
               {isSubmitting ? 'Teeing off...' : 'Start Game'}
               {!isSubmitting && <ArrowRight className="w-6 h-6" />}
            </button>
         </div>
      </div>
   );
}
