import * as React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import theme from '../theme';
import Link from '../components/Link';
import Layout from '../components/Layout';
import { GatsbyImage } from "gatsby-plugin-image"

import { DataGrid } from '@material-ui/data-grid';

const columns = [
  {
    field: 'thumbnail',
    headerName: ' ',
    width: 150,
    renderCell: (params) => {
      if (params.value) {
        return (<div><GatsbyImage image={params.value} alt="Publication thumbnail" /></div>)
      }
      return (<div/>)
    },
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 300,
    renderCell: (params) => {
      const pubPath= `/browse/publication/${params.id}`
      return (
        <Link to={pubPath}>
      <Typography variant="body1" style={{ whiteSpace: 'normal', wordWrap: "break-word" }} >{params.value}</Typography>
      </Link>
    )
    }
  },
  { field: 'authors',
    headerName: 'Authors',
    width: 230,
    renderCell: (params) => (
      <div>
      <Typography variant="body2" style={{ whiteSpace: 'normal', wordWrap: "break-word" }} >{params.value}</Typography>
      </div>
    )
  },
  {
    field: 'keywords',
    headerName: 'Keywords',
    width: 180,
  },
];


const useStyles = makeStyles({
  publicationTable: {
    height: 780,
  },
});

const Render = ({ data }) => {
  const issue = data.json.issue;
  const classes = useStyles();
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
            {issue.name}
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
        <Box className={classes.publicationTable}>
          <DataGrid rowHeight={80} rows={rows} columns={columns} pageSize={8}/>
        </Box>
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
