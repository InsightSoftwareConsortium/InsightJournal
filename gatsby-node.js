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
  console.log(node.internal.type)
  const { createNodeField } = actions
  if (node.internal.type === 'Publication') {
    console.log('Publication!!')
    // Use `createFilePath` to turn json files in our `src/publications` directory into ``
    const relativeFilePath = createFilePath({
      node,
      getNode,
      basePath: "data/publications",
    })
    console.log(relativeFilePath)
    // Creates new query'able field with name of 'slug'
    createNodeField({
      node,
      name: "slug",
      value: `/publications${relativeFilePath}`,
    })
  }
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  const publicationTemplate = path.resolve(`src/templates/publication.js`)
  // **Note:** The graphql function call returns a Promise
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise for more info
  return graphql(`
{
    allPublication {
        edges {
            node {
                fields {
                    slug
                }
            }
        }
    }
}
  `).then(result => {
    console.log(JSON.stringify(result, null, 4))
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
  })
}
