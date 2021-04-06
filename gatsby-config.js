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
    {
      resolve: `@gatsby-contrib/gatsby-plugin-elasticlunr-search`,
      options: {
        // Fields to index
        fields: [`title`, `abstract`, `categories`, `publication_id`],
        // How to resolve each field`s value for a supported node type
        resolvers: {
          // For any node of type MarkdownRemark, list how to resolve the fields` values
          Json: {
            title: (node) => {
              if(node.publication) {
                return node.publication.title;
              } else {
                return "";
              }
            },
            abstract: (node) => {
              if(node.publication) {
                return node.publication.abstract;
              } else {
                return "";
              }
            },
            categories: (node) => {
              if(node.publication) {
                return node.publication.categories;
              } else {
                return "";
              }
            },
            publication_id: (node) => {
              if(node.publication) {
                return node.publication.publication_id;
              } else {
                return "";
              }
            },
          },
        },
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
    copyrightHolder: "Kitware, Inc.",
  },
};
