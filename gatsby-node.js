// exports.onCreateNode = ({ node }) => {
//   console.log(node.internal.type)
//   // if (node.internal.type === "JSON") {
//   //   console.log('JSON!')
//   // } else {
//   //   console.log('not JSON!')
//   // }
// }
const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === 'Publication') {
    // Use `createFilePath` to turn json files in our `src/publications` directory into ``
    const relativeFilePath = createFilePath({
      node,
      getNode,
      basePath: "data/publications",
    })
    // Creates new query'able field with name of 'slug'
    const publicationNumber = relativeFilePath.split('/')[1]
    console.log('Publication!!', publicationNumber)
    createNodeField({
      node,
      name: "slug",
      value: `/browse/publication/${publicationNumber}`,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const publicationTemplate = path.resolve(`src/templates/publication.js`)
  // **Note:** The graphql function call returns a Promise
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise for more info
  const siteMetadata = await graphql(`
  query {
    site {
      siteMetadata {
        targetJournal
      }
    }
  }
  `)
  const targetJournal = siteMetadata.data.site.siteMetadata.targetJournal
  const result = await graphql(`
{
    allPublication(filter: {journals: {elemMatch: {journal_id: {eq: ${targetJournal}}}}}) {
        edges {
            node {
                fields {
                    slug
                }
            }
        }
    }
}
  `)
  result.data.allPublication.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: publicationTemplate,
      context: {
        // Data passed to context is available in page queries as GraphQL variables.
        slug: node.fields.slug,
      },
    })
  })
}
