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
const CopyPlugin = require('copy-webpack-plugin')
const fs = require('fs')

const staticDir = path.join(__dirname, 'static')
const ipfsScript = path.join(staticDir, 'ipfs-core.min.js')
if (!fs.existsSync(ipfsScript)) {
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir)
  }
  fs.copyFileSync(path.join(__dirname, 'node_modules', 'ipfs-core', 'dist', 'index.min.js'),
    ipfsScript)
}

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  actions.setWebpackConfig({
    plugins: [
    ],
  })
}

function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === 'Json') {
    if (node.publication) {
      const publication_id = String(node.publication.publication_id)
      createNodeField({
        node,
        name: "slug",
        value: `/browse/publication/${publication_id}`,
      })
    } else if (node.issue) {
      const issue_id = String(node.issue.issue_id)
      createNodeField({
        node,
        name: "slug",
        value: `/browse/issue/${issue_id}`,
      })
    }
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const publicationTemplate = path.resolve(`src/templates/publication.js`)
  const issueTemplate = path.resolve(`src/templates/issue.js`)
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
    allJson(filter: {publication:{ journals: {elemMatch: {journal_id: {eq: ${targetJournal}}}}}}) {
        edges {
            node {
                fields {
                    slug,
                }
                publication {
                    publication_id,
                }
            }
        }
    }
}
  `)
  publications.data.allJson.edges.forEach(({ node }, index) => {
    let prev_id = null
    if (index-1 >= 0) {
      prev_id = publications.data.allJson.edges[index-1].node.publication.publication_id
    }
    let next_id = null
    if (index + 1 < publications.data.allJson.edges.length) {
      next_id = publications.data.allJson.edges[index+1].node.publication.publication_id
    }
    createPage({
      path: node.fields.slug,
      component: publicationTemplate,
      context: {
        // Data passed to context is available in page queries as GraphQL variables.
        slug: node.fields.slug,
        cover: `${node.publication.publication_id}/cover.jpeg`,
        pub_id: node.publication.publication_id,
        prev_id,
        next_id,
      },
    })
  })

  const journalPublicationIds = new Set(publications.data.allJson.edges.map(({ node }) => {
    return node.publication.publication_id
  }))

  const issues = await graphql(`
{
  allJson(
    filter: {issue: {issue_id: {gt: 0}}}
    sort: {fields: issue___issue_id, order: DESC}
  ) {
    edges {
      node {
	fields {
	    slug,
	}
        issue {
          issue_id
	  publications
        }
      }
    }
  }
}
`)
  const issuesOfInterest = issues.data.allJson.edges.filter(({ node }) => {
    if (node.issue.publications.length < 1) {
      return false
    }
    const issuePublicationIds = new Set(node.issue.publications)
    return isSuperset(journalPublicationIds, issuePublicationIds)
  })
  issuesOfInterest.forEach(({ node }, index) => {
    let prev_id = null
    if (index-1 >= 0) {
      prev_id = issuesOfInterest[index-1].node.issue.issue_id
    }
    let next_id = null
    if (index + 1 < issuesOfInterest.length) {
      next_id = issuesOfInterest[index+1].node.issue.issue_id
    }
    const thumbnails = node.issue.publications.map((p) => `${p}/thumbnail.jpeg`)
    createPage({
      path: node.fields.slug,
      component: issueTemplate,
      context: {
        // Data passed to context is available in page queries as GraphQL variables.
        slug: node.fields.slug,
        publications: node.issue.publications,
        thumbnails,
        prev_id,
        next_id,
      },
    })
  })
}
