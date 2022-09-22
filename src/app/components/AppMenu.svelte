<script lang="ts">
  import { push, replace } from 'svelte-spa-router';

  import Icon from '../../ui/components/icon/Icon.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import NavGroup from '../../ui/components/nav/NavGroup.svelte';
  import { Alignment, IconSize, ViewState } from '../../ui/enums';
  import { Onyx } from '../../ui/services';
  import { updateView } from '../../ui/stores/view';
  import { getShortcutFromIndex } from '../../ui/utils/getShortcutFromIndex';

  import { menu, user } from '../stores/user';
  import { IconCosmos, IconDiscover, IconInbox, IconPlayer, IconSearch, IconUser } from '../assets/icons';

  $menu = [
    { id: 'discover', text: 'Discover', route: '#/', icon: IconDiscover },
    { id: 'inbox', text: 'Inbox', route: '/inbox', icon: IconInbox },
    { id: 'search', text: 'Search', route: '/search', icon: IconSearch },
    { id: 'player', text: 'Player', route: '/player', icon: IconPlayer },
    { id: 'user', text: 'User', route: '/user', icon: IconUser },
  ];
</script>

<NavGroup groupId="app-menu">
  <div class="header">
    <div class="flex items-center">
      <Icon><IconCosmos /></Icon>
      <strong class="text-sm">CosmosFM</strong>
    </div>
    {#if $user}
      <img src={$user.avatar.picture.thumbnailUrl} class="rounded-full w-8 h-8" alt="CosmosFM" />
    {/if}
  </div>
  <div class="scroller" data-nav-scroller>
    {#each $menu as item, i}
      <ListItem
        icon={item.icon}
        align={Alignment.Middle}
        imageSize={IconSize.Small}
        primaryText={item.text}
        navi={{
          itemId: `menu_${i + 1}`,
          shortcutKey: getShortcutFromIndex(i),
          onSelect: () => {
            console.log(`Select a menu. ${item.route}`);

            Onyx.appMenu.close();
            if (location.hash.startsWith(`#${item.route}`)) {
              updateView({ viewing: ViewState.Card });
              return;
            }
            replace(item.route);
          },
        }}
      />
    {/each}
  </div>
</NavGroup>

<style lang="postcss">
  :global([data-nav-group-id='app-menu']) {
    border-radius: var(--radius) var(--radius) 0 0;
    background-color: var(--card-color);
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .header {
    @apply flex items-center justify-between p-4 text-accent;
  }
  .scroller {
    overflow-y: auto;
    flex: 1;
  }
</style>
