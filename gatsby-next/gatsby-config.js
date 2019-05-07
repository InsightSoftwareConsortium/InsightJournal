module.exports = {
  plugins: [
    'gatsby-plugin-top-layout',
    {
      resolve: 'gatsby-plugin-material-ui',
      // If you want to use styled components you should change the injection order.
      options: {
        // stylesProvider: {
        //   injectFirst: true,
        // },
      },
    },
    // If you want to use styled components you should add the plugin here.
    // 'gatsby-plugin-styled-components',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'publications',
        path: './src/publications',
      },
    },
    {
      resolve: 'gatsby-transformer-json',
      // resolve: 'gatsby-source-filesystem',
      options: {
        name: 'publications',
        path: './src/publications',
        typeName: 'Publication',
        // typeName: ({ node, object, isArray }) => 'Publication'
      },
    },
  ],
  siteMetadata: {
    title: 'Insight Journal',
  },
};
