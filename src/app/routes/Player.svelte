<script lang="ts">
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { menu, user } from '../stores';
  import { useEpisode } from '../services';

  export let params: { eid: string };

  const episode = useEpisode(params.eid);

  $menu = [{ id: 'logout', text: 'Log out', route: '/', icon: MdHome }];
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Episode" />
      <CardContent />
    </Card>
  </ViewContent>
</View>