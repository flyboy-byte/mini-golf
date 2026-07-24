import { useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  useGetGame,
  useUpsertScore,
  useCompleteGame,
  useAddPlayer,
  useRemovePlayer,
  getGetGameQueryKey,
  getGetLeaderboardQueryKey,
  getListGamesQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Check, Plus, UserMinus, Save } from 'lucide-react';

function scoreFor(scores: { playerId: number; hole: number; strokes: number }[], playerId: number, hole: number) {
  return scores.find((s) => s.playerId === playerId && s.hole === hole)?.strokes ?? null;
}

function totalFor(scores: { playerId: number; strokes: number }[], playerId: number) {
  return scores.filter((s) => s.playerId === playerId).reduce((sum, s) => sum + s.strokes, 0);
}

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const id = Number(gameId);
  const { data: game, isLoading } = useGetGame(id, {
    query: { queryKey: getGetGameQueryKey(id), refetchInterval: 5000 },
  });
  const upsertScore = useUpsertScore();
  const completeGame = useCompleteGame();
  const addPlayer = useAddPlayer();
  const removePlayer = useRemovePlayer();
  const queryClient = useQueryClient();
  const [newPlayer, setNewPlayer] = useState('');
  const [editing, setEditing] = useState<{ playerId: number; hole: number; value: string } | null>(null);
  const [saving, setSaving] = useState<{ playerId: number; hole: number } | null>(null);

  if (isLoading || !game) {
    return <div className="p-8 text-emerald-800">Loading game...</div>;
  }

  const holes = Array.from({ length: game.holes }, (_, i) => i + 1);

  const handleScoreSave = async (playerId: number, hole: number) => {
    const strokes = Number(editing?.value);
    if (!Number.isFinite(strokes) || strokes < 1) return;
    setSaving({ playerId, hole });
    await upsertScore.mutateAsync({ gameId: id, data: { playerId, hole, strokes } });
    queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
    setEditing(null);
    setSaving(null);
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.trim()) return;
    await addPlayer.mutateAsync({ gameId: id, data: { name: newPlayer.trim() } });
    queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(id) });
    setNewPlayer('');
  };

  const handleRemovePlayer = async (playerId: number) => {
    await removePlayer.mutateAsync({ gameId: id, playerId });
    queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(id) });
  };

  const handleComplete = async () => {
    await completeGame.mutateAsync({ gameId: id });
    queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="text-emerald-800 -ml-3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">{game.name}</h1>
              <p className="text-emerald-700 text-sm">
                {game.holes} holes • {game.players.length} players
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/games/${id}/leaderboard`}>
              <Button variant="outline" className="border-amber-200 text-amber-800 hover:bg-amber-50">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
            {!game.completedAt && (
              <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="w-4 h-4 mr-2" />
                Finish Game
              </Button>
            )}
          </div>
        </div>

        <Card className="border-emerald-100 bg-white/90 overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-emerald-100/50">
                  <th className="text-left p-3 text-emerald-900 font-semibold sticky left-0 bg-emerald-100/50 z-10">Player</th>
                  {holes.map((h) => (
                    <th key={h} className="p-3 text-center text-emerald-900 font-semibold w-16">
                      {h}
                    </th>
                  ))}
                  <th className="p-3 text-center text-emerald-900 font-semibold w-20">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {game.players.map((player) => (
                  <tr key={player.id} className="border-t border-emerald-100">
                    <td className="p-3 font-medium text-emerald-900 sticky left-0 bg-white z-10">{player.name}</td>
                    {holes.map((h) => {
                      const current = scoreFor(game.scores, player.id, h);
                      const isEditing = editing?.playerId === player.id && editing?.hole === h;
                      return (
                        <td key={h} className="p-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                autoFocus
                                value={editing.value}
                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleScoreSave(player.id, h);
                                  if (e.key === 'Escape') setEditing(null);
                                }}
                                className="w-14 h-8 text-center p-0 border-emerald-200"
                              />
                              <Button
                                size="icon"
                                className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={saving?.playerId === player.id && saving?.hole === h}
                                onClick={() => handleScoreSave(player.id, h)}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              className="w-12 h-8 rounded-md border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 transition-colors"
                              onClick={() => setEditing({ playerId: player.id, hole: h, value: current?.toString() ?? '' })}
                            >
                              {current ?? '-'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-emerald-900">{totalFor(game.scores, player.id)}</td>
                    <td className="p-2">
                      {!game.completedAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemovePlayer(player.id)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {!game.completedAt && (
          <Card className="border-emerald-100 bg-white/90">
            <CardHeader>
              <CardTitle className="text-emerald-900 text-lg">Add Player</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="Player name"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                className="border-emerald-200"
              />
              <Button onClick={handleAddPlayer} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
