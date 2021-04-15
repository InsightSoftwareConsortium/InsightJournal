import * as React from "react";
import { graphql } from "gatsby";
import { ThemeProvider } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import theme from '../theme';
import Layout from '../components/Layout';
import PublicationsTable from '../components/PublicationsTable';
import IssuesIcon from '@material-ui/icons/LibraryBooksOutlined';

const Render = ({ data }) => {
  const issue = data.json.issue;
  const thumbnails = new Map()
  data.allFile.edges.forEach((f) => {
    const pub = parseInt(f.node.relativePath.split('/')[0])
    thumbnails.set(pub, f.node.childImageSharp)
  })
  const rows = data.allJson.edges.map((pub) => {
    const publication = pub.node.publication
    const thumbnail = thumbnails.has(publication.publication_id) ? thumbnails.get(publication.publication_id).gatsbyImageData: null
    const row = { id: publication.publication_id,
      title: publication.title,
      authors: publication.authors.map(a => a.author_fullname).join(", "),
      keywords: publication.tags.join(", "),
      thumbnail,
    }
    return row
  })

  return (
    <>
      <ThemeProvider theme={theme}>
        <Layout>
        <Container maxWidth="md">
          <Typography variant="h5" component="h1" gutterBottom>
             <IssuesIcon/>{' '}{issue.name}
          </Typography>
          <Typography variant="overline" paragraph={true}>
           Issue
          </Typography>
          <Typography variant="subtitle1" paragraph={true}>
            {issue.short_description}
          </Typography>
          <Typography variant="subtitle2" paragraph={true}>
            {issue.introductory_text}
          </Typography>
          <PublicationsTable rows={rows} />
        </Container>
        </Layout>
      </ThemeProvider>
    </>
  );
};

export default Render;

export const query = graphql`
  query IssueQuery($slug: String!, $publications: [Int!], $thumbnails: [String!]) {
    json(fields: { slug: { eq: $slug } }) {
      issue {
        issue_id
        name
        publications
        short_description
        introductory_text
      }
    }
    allJson(filter: {publication: {publication_id: {in: $publications}}}) {
      edges {
        node {
          publication {
            title
            authors {
              author_fullname
            }
            publication_id
            tags
          }
        }
      }
    }
    allFile(filter: {relativePath: {in: $thumbnails}}) {
    edges {
      node {
        childImageSharp {
          gatsbyImageData(layout: FIXED)
        }
        relativePath
      }
    }
  }
}
`;
