<script lang="ts">
  import { replace } from 'svelte-spa-router';

  import Button from '../../ui/components/buttons/Button.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { registerView } from '../../ui/stores';
  import { Priority, RenderState } from '../../ui/enums';

  import { stop } from '../components/Audio.svelte';
  import { IconDiscover, IconInbox, IconPlayer, IconUser } from '../assets/icons';

  import { menu } from '../stores/user';
  import { Client } from '../services';

  registerView({});

  $menu = [
    { id: 'discover', text: 'Discover', route: '#/', icon: IconDiscover },
    { id: 'inbox', text: 'Inbox', route: '/inbox', icon: IconInbox },
    { id: 'player', text: 'Player', route: '/player', icon: IconPlayer },
    { id: 'user', text: 'User', route: '/user', icon: IconUser },
  ];

  function logout() {
    // Stop current playing episode.
    stop();

    Client.logout();
    replace('/');
  }
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="User" />
      <CardContent>
        <Button
          title="Logout"
          navi={{
            itemId: 'logout',
            onSelect: () => logout(),
          }}
        />
      </CardContent>
    </Card>
  </ViewContent>
</View>
