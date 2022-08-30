<script lang="ts">
  export let progress: number;
</script>

<div class="h-2 opacity-50 relative max-w-xl rounded-full overflow-hidden mx-auto">
  <div class="w-full h-full bg-gray-200 absolute" />
  <div class="h-full bg-shakespeare-500 absolute" style="width: {progress * 100}%" />
</div>
