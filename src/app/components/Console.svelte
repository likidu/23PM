<script lang="ts">
  let warn: string;
  let error: string;

  const console = (function (oldCons) {
    return {
      ...oldCons,
      warn: function (text) {
        oldCons.warn(text);
        warn = text;
      },
      error: function (text) {
        oldCons.error(text);
        error = text;
      },
    };
  })(window.console);

  window.console = console;

  // $: console.error = (function () {
  //   const error = console.error;
  //   console.log('Here');

  //   return function () {
  //     error.apply(console, arguments);
  //     logs.push(Array.from(arguments));

  //     // console.log('Error', logs);
  //   };
  // })();
</script>

<div id="console-errors">
  {#if warn}
    <p class="line-clamp-2 text-orange-300 ">{warn}</p>
  {/if}
  {#if error}
    <p class="line-clamp-2 text-red-300">{error}</p>
  {/if}
</div>
