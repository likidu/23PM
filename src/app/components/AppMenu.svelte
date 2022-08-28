<script lang="ts">
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import NavGroup from '../../ui/components/nav/NavGroup.svelte';
  import { ViewState } from '../../ui/enums';
  import { Onyx } from '../../ui/services';
  import { updateView } from '../../ui/stores/view';
  import { getShortcutFromIndex } from '../../ui/utils/getShortcutFromIndex';

  import { menu } from '../stores';

  import { push } from 'svelte-spa-router';
</script>

<NavGroup groupId="app-menu">
  <div class="header">OnyxUI Demo</div>
  <div class="scroller" data-nav-scroller>
    {#each $menu as item, i}
      <ListItem
        icon={item.icon}
        primaryText={item.text}
        navi={{
          itemId: item.id,
          shortcutKey: getShortcutFromIndex(i),
          onSelect: () => {
            Onyx.appMenu.close();
            if (location.hash.startsWith(`#${item.route}`)) {
              updateView({ viewing: ViewState.Card });
              return;
            }
            push(item.route);
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