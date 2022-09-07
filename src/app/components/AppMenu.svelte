<script lang="ts">
  import { push, replace } from 'svelte-spa-router';

  import ListItem from '../../ui/components/list/ListItem.svelte';
  import NavGroup from '../../ui/components/nav/NavGroup.svelte';
  import { IconSize, ViewState } from '../../ui/enums';
  import { Onyx } from '../../ui/services';
  import { updateView } from '../../ui/stores/view';
  import { getShortcutFromIndex } from '../../ui/utils/getShortcutFromIndex';

  import { menu } from '../stores/user';
</script>

<NavGroup groupId="app-menu">
  <div class="header">Cosmos FM</div>
  <div class="scroller" data-nav-scroller>
    {#each $menu as item, i}
      <ListItem
        icon={item.icon}
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

<style>
  :global([data-nav-group-id='app-menu']) {
    border-radius: var(--radius) var(--radius) 0 0;
    background-color: var(--card-color);
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .header {
    padding: 5px;
    font-weight: var(--bold-font-weight);
    color: var(--accent-color);
    text-align: center;
  }
  .scroller {
    overflow-y: auto;
    flex: 1;
  }
</style>
