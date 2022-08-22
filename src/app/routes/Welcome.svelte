<script lang="ts">
  import { onMount } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import { registerView, updateView, view } from '../../ui/stores';
  import { DataStatus } from '../../ui/enums';

  import Button from '../../ui/components/buttons/Button.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import Typography from '../../ui/components/Typography.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';

  import logo from '../assets/svelte.png';

  export let params: { cardId: string };

  registerView({
    cards: [
      {
        id: 'info',
        title: 'Welcome',
        onSelect: () => replace('/welcome/info'),
      },
      {
        id: 'login',
        title: 'SMS Code',
        onSelect: () => replace('/welcome/login'),
      },
    ],
    activeCardId: params.cardId ?? 'info',
  });

  function login() {
    console.log('Hello');
  }

  onMount(async () => {
    updateView({ dataStatus: DataStatus.Loaded });
  });
</script>

<View>
  <ViewContent>
    {#if params.cardId === $view.cards[0].id}
      <Card cardId={$view.cards[0].id}>
        <CardHeader />
        <CardContent>
          <Typography align="center" padding="both">XYZ FM on KaiOS</Typography>
          <Button
            title="Login with SMS"
            navi={{
              itemId: 'login',
              onSelect: async () => login(),
            }}
          />
        </CardContent>
      </Card>
    {:else if params.cardId === $view.cards[1].id}
      <Card>
        <CardHeader title="23PM" />
        <CardContent>
          <div class="logo">
            <img src={logo} alt="Svelte Logo" class="inline-box h-48 w-48" />
          </div>
        </CardContent>
      </Card>
    {/if}
  </ViewContent>
</View>
