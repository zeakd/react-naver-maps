const path = require('path');

module.exports = {
  require: [path.resolve(__dirname, 'styleguide/setup.js')],
  webpackConfig: {
    resolve: {
      alias: {
        'react-naver-maps': path.resolve(__dirname, './'),
      },
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
      ],
    },
  },
  pagePerSection: true,
  sections: [
    {
      name: 'React Naver Maps',
      sections: [
        {
          name: 'Introduction',
          content: 'docs/introduction.md',
        },
        {
          name: 'Getting Started',
          content: 'docs/getting-started.md',
          exampleMode: 'expand',
        },
        // {
        //   content: 'docs/introduction.md'
        // },
        // {
        //   content: 'docs/introduction.md'
        // },
      ],
    },
    {
      name: 'Naver Maps Examples',
      content: 'docs/examples/example-intro.md',
      sections: [
        {
          name: '지도 기본 예제',
          content: 'docs/examples/1-map-simple.md',
          description:
            'https://navermaps.github.io/maps.js/docs/tutorial-1-map-simple.example.html',
        },
        {
          name: '지도 옵션 조정하기',
          content: 'docs/examples/2-map-options.md',
          description:
            'https://navermaps.github.io/maps.js/docs/tutorial-2-map-options.example.html',
        },
        {
          name: '지도 유형 설정하기',
          content: 'docs/examples/3-map-types.md',
        },
        {
          name: '지도 좌표 경계 확인하기',
          content: 'docs/examples/4-map-bounds.md',
        },
      ],
      sectionDepth: 1,
    },
    {
      name: 'Advanced Guide',
      sections: [
        {
          name: 'Maps 인스턴스에 접근하기',
          content: 'docs/how-to-access-instance.md',
        },
      ],
    },
    {
      name: 'UI Components',
      components: ['src/components/NaverMap.js'],
    },
    {
      name: 'Overlay Views',
      components: [
        'src/components/Overlay.js',
        'src/components/overlays/**/[A-Z]*{.js,/index.js}',
      ],
      exampleMode: 'expand',
      usageMode: 'expand',
      sectionDepth: 1,
    },
    {
      name: 'Utils',
      components: ['src/RenderAfterNavermapsLoaded.js'],
    },
  ],
};
