import * as React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Link from '../components/Link';
import Container from '@material-ui/core/Container';
import theme from '../theme';
import Layout from '../components/Layout';
import PublicationsTable from '../components/PublicationsTable';
import IssuesIcon from '@material-ui/icons/LibraryBooksOutlined';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Fade from '@material-ui/core/Fade';

const useStyles = makeStyles({
  prevNext: {
    position: "fixed",
    bottom: 0,
    right: 0,
    paddingBottom: "60px",
    paddingRight: "30px",
  },
});

const Render = ({ data, pageContext }) => {
  const classes = useStyles();

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
      keywords: publication.tags ? publication.tags.join(", ") : null,
      thumbnail,
    }
    return row
  })

  const previousLink = pageContext.prev_id ? `/browse/issue/${pageContext.prev_id}` : `/browse/issue/${issue.issue_id}`
  const nextLink = pageContext.next_id ? `/browse/issue/${pageContext.next_id}` : `/browse/issue/${issue.issue_id}`

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
        <Box align="right" className={classes.prevNext}>
          <Tooltip title="Previous issue" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 400 }}><Link to={previousLink}><Button disabled={pageContext.prev_id === null}><NavigateBeforeIcon color="secondary" fontSize="large"/></Button></Link></Tooltip>
          <Tooltip title="Next issue" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 400 }}><Link to={nextLink}><Button disabled={pageContext.next_id === null}><NavigateNextIcon color="secondary" fontSize="large"/></Button></Link></Tooltip>
        </Box>
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
