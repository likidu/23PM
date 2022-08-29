<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@sveltestack/svelte-query';
  import Router, { location, replace, pop } from 'svelte-spa-router';

  import Inbox from './app/routes/Inbox.svelte';
  import Episode from './app/routes/Episode.svelte';
  import NotFound from './app/routes/NotFound.svelte';
  import Welcome from './app/routes/Welcome.svelte';
  import AppMenu from './app/components/AppMenu.svelte';

  import { KeyManager, Onyx } from './ui/services';
  import { Priority } from './ui/enums';
  import { settings } from './ui/stores';

  import { user } from './app/stores';

  import OnyxApp from './ui/components/frame/OnyxApp.svelte';

  const queryClient = new QueryClient();

  const routes = {
    '/': Inbox,
    '/welcome/:cardId': Welcome,
    '/episode/:eid': Episode,
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

  onMount(() => {
    if ($user === undefined) replace('/welcome/splash');
  });
</script>

<OnyxApp>
  <AppMenu slot="app-menu" />
  <QueryClientProvider client={queryClient}>
    <Router {routes} />
  </QueryClientProvider>
</OnyxApp>
