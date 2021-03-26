const path = require(`path`)

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
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'publications',
        path: './src/publications',
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: path.join(__dirname, `src`, `images`),
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
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
  ],
  siteMetadata: {
    title: 'Insight Journal',
  },
};
