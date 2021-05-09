export default {
  files: [
    // '../src/**/*.mdx',
    './docs/**/*.{md,mdx}',
  ],
  menu: [
    'Intro',
    {
      name: 'Components', menu: [
        {
          name: 'Overlay',
          menu: ['Circle'],
        },
        // 'Hello',
      ],
    },

  ],
  typescript: true,
};
