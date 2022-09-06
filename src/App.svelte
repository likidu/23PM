<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@sveltestack/svelte-query';
  import Router, { location, replace, pop } from 'svelte-spa-router';

  import OnyxApp from './ui/components/frame/OnyxApp.svelte';
  import Discover from './app/routes/Discover.svelte';
  import Inbox from './app/routes/Inbox.svelte';
  import Episode from './app/routes/Episode.svelte';
  import Player from './app/routes/Player.svelte';
  import User from './app/routes/User.svelte';
  import Welcome from './app/routes/Welcome.svelte';
  import NotFound from './app/routes/NotFound.svelte';
  import Audio from './app/components/Audio.svelte';
  import AppMenu from './app/components/AppMenu.svelte';
  import StripShade from './app/components/StripShade.svelte';

  import { KeyManager, Onyx } from './ui/services';
  import { Priority } from './ui/enums';
  import { settings } from './app/stores/settings';
  import { user } from './app/stores/user';
  import { player } from './app/stores/player';

  const queryClient = new QueryClient();

  const routes = {
    '/': Discover,
    '/inbox': Inbox,
    '/welcome/:cardId': Welcome,
    '/episode/:eid': Episode,
    '/player': Player,
    '/user': User,
    '*': NotFound,
  };

  const keyMan = KeyManager.subscribe(
    {
      onBackspace: () => {
        // If on the main screen, let KaiOS minimize the app
        if ($location === '/') {
          console.log('exit app');
          return false;
        }

        pop();
        return true;
      },
    },
    Priority.Low,
  );

  $: Onyx.settings.update($settings);

  $: if (!$user) replace('/welcome/splash');
</script>

<OnyxApp>
  {#if $user && $player.eid}
    <Audio />
  {/if}
  <AppMenu slot="app-menu" />
  <QueryClientProvider client={queryClient}>
    <Router {routes} />
  </QueryClientProvider>
  <StripShade />
</OnyxApp>
