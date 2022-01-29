import * as React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from "gatsby";
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { makeStyles } from '@mui/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Layout from '../components/Layout';
import PublicationsTable from '../components/PublicationsTable';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import parse, { domToReact } from 'html-react-parser';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { DataGrid } from '@mui/x-data-grid';
import Link from '../components/Link';
import StarIcon from '@mui/icons-material/Star';
import IssuesIcon from '@mui/icons-material/LibraryBooksOutlined';
import PublicationsIcon from '@mui/icons-material/LocalLibrary';
import loadable from "@loadable/component"

const LoadableNetlifyIdentityRedirect = loadable(() => import('../components/NetlifyIdentityRedirect'))

function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

const issueColumns = [
  {
    field: 'name',
    headerName: 'Name',
    width: 400,
    renderCell: (params) => {
      const issuePath = `/browse/issue/${params.value.issue_id}`
      return (
        <div>
        <Link to={issuePath}>
          <Typography variant="body1" style={{ whiteSpace: 'normal', wordWrap: "break-word" }} >{params.value.name}</Typography>
        </Link>
        </div>
      )
    },
  },
]

const parseOptions = {
  replace: domNode => {
    if (domNode.type === "tag" && domNode.name === "ul") {
      return (<List>{domToReact(domNode.children, parseOptions)}</List>)
    } else if(domNode.type === "tag" && domNode.name === "li") {
      return (<ListItem><ListItemIcon><StarIcon /></ListItemIcon><ListItemText>{domToReact(domNode.children, parseOptions)}</ListItemText></ListItem>)
    }
    return domNode
  },
}

const useStyles = makeStyles({
  issueTable: {
    height: 400,
  },
});


export default function Index({ data }) {
  const classes = useStyles();

  const siteMetadata = data.site.siteMetadata
  const targetJournal = siteMetadata.targetJournal

  const thumbnails = new Map()
  data.allFile.edges.forEach((f) => {
    const pub = parseInt(f.node.relativePath.split('/')[0])
    thumbnails.set(pub, f.node.childImageSharp)
  })
  const targetPubs = data.allJson.edges.filter((pub) => {
    if (pub.node.publication) {
      return pub.node.publication.journals.filter((p) => p.journal_id === targetJournal).length > 0
    }
    return false
  })
  const publicationRows = targetPubs.map((pub) => {
    const publication = pub.node.publication
    const thumbnail = thumbnails.has(publication.publication_id) ? thumbnails.get(publication.publication_id).gatsbyImageData: null
    const row = { id: publication.publication_id,
      title: publication.title,
      authors: publication.authors.map(a => a.author_fullname).join(", "),
      keywords: publication.tags ? publication.tags.join(", ") : null,
      thumbnail,
    }
    return row
  }).reverse()

  const journalPublicationIds = new Set(targetPubs.map(({ node }) => {
    return node.publication.publication_id
  }))
  const targetIssues = data.allJson.edges.filter((issue) => {
    if (issue.node.issue && issue.node.issue.publications.length > 0) {

      const issuePublicationIds = new Set(issue.node.issue.publications)
      return isSuperset(journalPublicationIds, issuePublicationIds)
    }
    return false
  })
  targetIssues.sort((a, b) => a.node.issue.issue_id - b.node.issue.issue_id).reverse()
  const issueRows = targetIssues.map(({ node }) => {
    return { id: node.issue.issue_id, name: { issue_id: node.issue.issue_id, name: node.issue.name } }
  })

  return (
    <StyledEngineProvider injectFirst>
      <Helmet>
        <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
      </Helmet>
      <Layout>
        <Container maxWidth="lg">
	  <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
	      <Accordion>
		<AccordionSummary
		  expandIcon={<ExpandMoreIcon />}
		>
		  <Typography>{parse(siteMetadata.description)}</Typography>
		</AccordionSummary>
		<AccordionDetails>
                  <Typography component={'span'}>{parse(siteMetadata.extendedDescription, parseOptions)}</Typography>
		</AccordionDetails>
	      </Accordion>
            </Grid>
            <Grid item xs={12} sm={6} zeroMinWidth>
	      <Paper elevation={3}>
                <Typography variant="h5" component="h2" align="center"><IssuesIcon/>{' '}Issues</Typography>
                  <Box className={classes.issueTable}>
                    <DataGrid autoHeight={true} rowsPerPageOptions={[4]} headerHeight={38} rowHeight={70} rows={issueRows} columns={issueColumns} pageSize={4}/>
                  </Box>
	      </Paper>
            </Grid>
          </Grid>
          <Box sx={{ my: 4 }}>
            <Typography variant="h5" component="h2"><PublicationsIcon/>{' '}Publications</Typography>
            <PublicationsTable rows={publicationRows} />
          </Box>
        </Container>
        
        <LoadableNetlifyIdentityRedirect />
      </Layout>
    </StyledEngineProvider>
  );
}

export const query = graphql`
  query IndexQuery {
    allJson {
      edges {
        node {
          publication {
            title
            authors {
              author_fullname
            }
            publication_id
            tags
            journals {
              journal_id
            }
          }
          issue {
            issue_id
            name
            publications
            short_description
            introductory_text
          }
        }
      }
    }
    allFile(filter: {relativePath: {glob: "*/thumbnail.jpeg"}}) {
      edges {
        node {
          childImageSharp {
            gatsbyImageData
          }
          relativePath
        }
      }
    }
    site {
      siteMetadata {
        targetJournal
        description
        extendedDescription
      }
    }
}
`;
