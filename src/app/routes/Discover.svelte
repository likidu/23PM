<script lang="ts">
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { registerView } from '../../ui/stores';
  import { Priority, RenderState } from '../../ui/enums';

  import EditorPickList from '../components/EditorPickList.svelte';
  import { IconDiscover, IconInbox, IconPlayer, IconUser } from '../assets/icons';

  import { menu } from '../stores/user';
  import { useEditorPickList } from '../services';

  const editorPick = useEditorPickList();

  registerView({});

  $menu = [
    { id: 'discover', text: 'Discover', route: '#/', icon: IconDiscover },
    { id: 'inbox', text: 'Inbox', route: '/inbox', icon: IconInbox },
    { id: 'player', text: 'Player', route: '/player', icon: IconPlayer },
    { id: 'user', text: 'User', route: '/user', icon: IconUser },
    { id: 'logout', text: 'Log out', route: '#/', icon: IconUser },
  ];
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Discover" />
      <CardContent>
        {#if $editorPick.status === 'loading'}
          <span>Loading...</span>
        {:else if $editorPick.status === 'error'}
          <span class="text-red-500">Error!</span>
        {:else}
          <EditorPickList editorPick={$editorPick.data} />
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
