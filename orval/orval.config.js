const file = 'xiaoyuzhoufm';

module.exports = {
  api: {
    output: {
      mode: 'tags-split',
      target: `src/${file}.ts`,
      schemas: 'src/model',
      client: 'svelte-query',
      mock: false,
      override: {
        mutator: {
          path: './client.ts',
          name: 'client',
        },
      },
    },
    input: {
      target: `./${file}.yaml`,
    },
  },
};
