// exports.onCreateNode = ({ node }) => {
//   console.log(node.internal.type)
//   // if (node.internal.type === "JSON") {
//   //   console.log('JSON!')
//   // } else {
//   //   console.log('not JSON!')
//   // }
// }
const { createFilePath } = require('gatsby-source-filesystem')
const path = require('path')

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
    const publication_id = relativeFilePath.split('/')[1]
    createNodeField({
      node,
      name: "slug",
      value: `/browse/publication/${publication_id}`,
    })
    createNodeField({
      node,
      name: "publication_id",
      value: publication_id,
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
  const publications = await graphql(`
{
    allPublication(filter: {journals: {elemMatch: {journal_id: {eq: ${targetJournal}}}}}) {
        edges {
            node {
                fields {
                    slug,
                    publication_id
                }
            }
        }
    }
}
  `)
  publications.data.allPublication.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: publicationTemplate,
      context: {
        // Data passed to context is available in page queries as GraphQL variables.
        slug: node.fields.slug,
        cover: `${node.fields.publication_id}/cover.jpeg`,
      },
    })
  })
}
