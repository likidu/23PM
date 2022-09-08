<script lang="ts">
  let css: string = '';
  export { css as class };
</script>

<div class={`root ${css}`} data-nav-scroller>
  <slot />
</div>

<style lang="postcss">
  .root {
    @apply flex-1 overflow-x-hidden overflow-y-auto;
  }
</style>
