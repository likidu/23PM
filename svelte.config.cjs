const sveltePreprocess = require('svelte-preprocess');
module.exports = {
  preprocess: [
    sveltePreprocess({
      postcss: true,
      replace: [[/process\.env\.(\w+)/g, (_, prop) => JSON.stringify(process.env[prop])]],
    }),
  ],
  // we'll extract any component CSS out into
  // a separate file — better for performance
  css: (css) => {
    css.write('bundle.css');
  },
};
