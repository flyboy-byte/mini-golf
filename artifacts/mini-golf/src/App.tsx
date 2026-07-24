import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/home';
import NewGame from '@/pages/new-game';
import Scorecard from '@/pages/scorecard';
import Leaderboard from '@/pages/leaderboard';
import Layout from '@/components/layout';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/games/new" component={NewGame} />
              <Route path="/games/:gameId" component={Scorecard} />
              <Route path="/games/:gameId/leaderboard" component={Leaderboard} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
