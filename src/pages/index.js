import * as React from 'react';
import { graphql } from "gatsby";
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Layout from '../components/Layout';
import PublicationsTable from '../components/PublicationsTable';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import parse, { domToReact } from 'html-react-parser';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { DataGrid } from '@material-ui/data-grid';
import Link from '../components/Link';

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
    width: 300,
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
      return (<ListItem>{domToReact(domNode.children, parseOptions)}</ListItem>)
    }
    return domNode
  },
}

const useStyles = makeStyles({
  issueTable: {
    height: 190,
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
      keywords: publication.tags.join(", "),
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
                  <Typography>{parse(siteMetadata.extendedDescription, parseOptions)}</Typography>
		</AccordionDetails>
	      </Accordion>
            </Grid>
            <Grid item xs={12} sm={6} zeroMinWidth>
	      <Paper elevation={3}>
		 <Typography variant="h5" component="h2" align="center">Issues</Typography>
                  <Box className={classes.issueTable}>
                    <DataGrid headerHeight={38} rowHeight={30} rows={issueRows} columns={issueColumns} pageSize={4}/>
                  </Box>
	      </Paper>
            </Grid>
          </Grid>
          <Box sx={{ my: 4 }}>
	    <Typography variant="h5" component="h2">Publications</Typography>
            <PublicationsTable rows={publicationRows} />
          </Box>
        </Container>
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
