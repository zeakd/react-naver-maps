const path = require('path')


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
          loader: 'babel-loader'
        },
			],
    },
  },
  context: {
    // YOUR_CLIENT_ID: JSON.stringify(MAP_CLIENT_ID),
  },
  pagePerSection: true,
  sections: [
    {
      name: 'Introduction',
      content: 'docs/introduction.md'
    },
    {
      name: 'Examples',
      content: 'docs/examples/example-intro.md',
      sections: [
        {
          name: '지도 기본 예제',
          content: 'docs/examples/1-map-simple.md',
          description: 'https://navermaps.github.io/maps.js/docs/tutorial-1-map-simple.example.html',
        },
        {
          name: '지도 옵션 조정하기',
          content: 'docs/examples/2-map-options.md',
          description: 'https://navermaps.github.io/maps.js/docs/tutorial-2-map-options.example.html',
        },
        {
          name: '지도 유형 설정하기',
          content: 'docs/examples/3-map-types.md',
        },
        {
          name: '지도 좌표 경계 확인하기',
          content: 'docs/examples/4-map-bounds.md',
        },
      ]
    },
    // {
    //   name: 'Documentation',
    //   sections: [
    //     {
    //       name: 'Installation',
    //       content: 'docs/installation.md',
    //       description: 'The description for the installation section'
    //     },
    //   ]
    // },
    {
      name: 'Components',
      pagePerSection: true,
      sections: [
        {
          name: 'Overlay Views',
          components: [
            'src/components/overlays/Overlay.js',
            'src/components/overlays/**/[A-Z]*{.js,/index.js}',
          ]
        } 
      ]
      // components: 'src/components/**/[A-Z]*{.js,/index.js}',
      // exampleMode: 'expand', // 'hide' | 'collapse' | 'expand'
      // usageMode: 'expand' // 'hide' | 'collapse' | 'expand'
    }
  ]
}