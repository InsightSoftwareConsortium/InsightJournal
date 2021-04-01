const path = require(`path`)

module.exports = {
  plugins: [
    'gatsby-plugin-top-layout',
    'gatsby-plugin-image',
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
        name: 'images',
        path: path.join(__dirname, 'src', 'images'),
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'publications',
        path: './src/publications',
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'issues',
        path: './src/issues',
      },
    },
    {
      resolve: 'gatsby-transformer-json',
      options: {
        typeName: 'Json',
      },
    },
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
  ],
  siteMetadata: {
    // 3: Insight Journal
    // 31: MIDAS Journal
    // 35: VTK Journal
    targetJournal: 31,
    title: "The MIDAS Journal",
  },
};
