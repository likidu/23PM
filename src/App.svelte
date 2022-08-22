<script lang="ts">
  import { onMount } from 'svelte';
  import Router, { replace } from 'svelte-spa-router';

  import Inbox from './app/routes/Inbox.svelte';
  import Episode from './app/routes/Episode.svelte';
  import NotFound from './app/routes/NotFound.svelte';
  import Welcome from './app/routes/Welcome.svelte';

  import { Onyx } from './ui/services';
  import { settings } from './ui/stores';

  import OnyxApp from './ui/components/frame/OnyxApp.svelte';

  const routes = {
    '/': Inbox,
    '/welcome/:cardId': Welcome,
    '/episode/:eid': Episode,
    '*': NotFound,
  };

  $: Onyx.settings.update($settings);

  onMount(() => {
    replace('/welcome');
  });
</script>

<OnyxApp>
  <Router {routes} />
</OnyxApp>
