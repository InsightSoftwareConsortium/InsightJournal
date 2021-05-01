import React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import theme from '../theme';
import Link from '../components/Link';
import Layout from '../components/Layout';
import Citation from '../components/Citation';
import { GatsbyImage } from "gatsby-plugin-image"
import MuiLink from '@material-ui/core/Link';
import targetJournalLogo from '../components/targetJournalLogo';
import PublicationsIcon from '@material-ui/icons/LocalLibrary';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Fade from '@material-ui/core/Fade';
import Tab from '@material-ui/core/Tab';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import LinearProgress from '@material-ui/core/LinearProgress';

const useStyles = makeStyles({
  pubTitle: {
    fontWeight:"bold",
    textAlign:"center",
    paddingBottom:"10px",
  },
  journal: {
    paddingTop:"10px",
  },
  loading: {
    paddingTop:"10px",
  },
  submittedBy: {
    paddingTop:"10px",
    paddingBottom:"15px",
    fontSize:"80%",
  },
  institution: {
    fontSize:"80%",
    textAlign:"center",
  },
  authors: {
    textAlign:"center",
  },
  prevNext: {
    position: "fixed",
    bottom: 0,
    right: 0,
    paddingBottom: "60px",
    paddingRight: "30px",
  },
});

function authorSort(a, b) {
  if (a.author_place < b.author_place) {
    return -1
  }
  if (a.author_place > b.author_place) {
    return 1
  }
  return 0
}

const Render = ({ data, pageContext }) => {
  const classes = useStyles();
  const publication = data.json.publication;
  const publicationIssues = data.allJson.edges

  const targetJournal = data.site.siteMetadata.targetJournal
  const { logo, logoAlt } = targetJournalLogo(targetJournal)

  const has_authors = publication.authors ? true : false;
  const authors = publication.authors
  authors.sort(authorSort)
  const ordered_authors = [];
  if (has_authors) {
    for (const author of authors) {
      if (author.persona_firstname) {
        ordered_authors.push(`${author.persona_lastname} ${author.persona_firstname[0]}.`)
      } else {
        ordered_authors.push(author.author_fullname)
      }
    }
    ordered_authors.sort();
  }
  let submit_inst = "";
  let submit_auth = "";
  if(publication.submitted_by_author) {
    submit_inst = publication.submitted_by_author.author_institution
    submit_auth = `${publication.submitted_by_author.author_firstname} ${publication.submitted_by_author.author_lastname}`
  }

  const coverImage = data.coverImage ? <GatsbyImage image={data.coverImage.childImageSharp.gatsbyImageData} alt="Publication cover image"/> : <img src={logo} alt={logoAlt} />

  const previousLink = pageContext.prev_id ? `/browse/publication/${pageContext.prev_id}` : `/browse/publication/${publication.publication_id}`
  const nextLink = pageContext.next_id ? `/browse/publication/${pageContext.next_id}` : `/browse/publication/${publication.publication_id}`

  let citeLink = ""
  if (publication.revisions && publication.revisions.length) {
    const numHandles = publication.revisions.length
    const handleURL = `http://hdl.handle.net/${publication.revisions[numHandles-1].handle}`
    citeLink = <Typography variant="subtitle1" align="center">Please use this identifier to cite or link to this publication: <MuiLink href={handleURL}>{handleURL}</MuiLink></Typography>
  }

  let issueLinks = ""
  if (publicationIssues.length) {
    issueLinks = publicationIssues.map((issue) => {
      const name = issue.node.issue.name
      const issuePath = `/browse/issue/${issue.node.issue.issue_id}`
      return (<Link to={issuePath} key={name}> - {name}</Link>)
    })
  }

  const [tab, setTab] = React.useState('1');
  const handleTabChange = (event, newValue) => {
    console.log(event, newValue)
    setTab(newValue)
  }

  const [articleContent, setArticleContent] = React.useState(<><Typography m={2}>Loading...</Typography><LinearProgress color="secondary" /></>)
  const loadArticle = () => {
  }

  return (
    <>
    <ThemeProvider theme={theme}>
      <Layout>
      <Box component="div"  id="publication">
        <Box component="div"  className={classes.pubTitle}><Typography variant="h4" component="h1" align="center" color="primary.main">{publication.title}</Typography></Box>

        <Box component="div" color="secondary.main" className={classes.authors}>{ordered_authors.join(", ")}</Box>
        <Box component="div" color="secondary.main" className={classes.institution}><Typography variant="caption">{submit_inst}</Typography></Box>
        <center>{coverImage}</center>
        <br/>
        {citeLink}
        <Box component="div" className={classes.journal}><Typography variant="subtitle2"><PublicationsIcon />{' '}Published in <Link to="/">{data.site.siteMetadata.title}</Link>{issueLinks}.</Typography></Box>
        <Box component="div" className={classes.submittedBy} color="error">Submitted by {submit_auth} on {publication.date_submitted}.</Box>
        <TabContext value={tab}>
          <TabList indicatorColor="primary" textColor="primary" aria-label="publication component" onChange={handleTabChange}>
            <Tab label="Abstract" value="1" />
            <Tab label="Article" value="2" />
          </TabList>
          <TabPanel value="1"><Typography variant="body1">{publication.abstract}</Typography></TabPanel>
          <TabPanel value="2">{articleContent}</TabPanel>
        </TabContext>
      </Box>
<br/>
<Citation publication={publication} journalTitle={data.site.siteMetadata.title}/>
      <Box align="right" className={classes.prevNext}>
        <Tooltip title="Previous publication" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 400 }}><Link to={previousLink}><Button disabled={pageContext.prev_id === null}><NavigateBeforeIcon fontSize="large"/></Button></Link></Tooltip>
        <Tooltip title="Next publication" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 400 }}><Link to={nextLink}><Button disabled={pageContext.next_id === null}><NavigateNextIcon fontSize="large"/></Button></Link></Tooltip>
      </Box>
      </Layout>
    </ThemeProvider>
    </>
  );
};

export default Render;

export const query = graphql`
  query PublicationQuery($slug: String!, $cover: String!, $pub_id: Int) {
    json(fields: { slug: { eq: $slug } }) {
      publication {
        title
        abstract
        date_submitted
        authors {
          author_fullname
          author_place
        }
        submitted_by_author {
          author_institution
          author_firstname
          author_lastname
        }
        publication_id
        revisions {
          handle
        }
        categories
        comments {
          content
          date
          persona_firstname
          persona_lastname
        }
      }
    }
    site {
      siteMetadata {
        targetJournal,
        title,
      }
    }
    coverImage: file(relativePath: { eq: $cover }) {
        childImageSharp {
          gatsbyImageData(layout: FIXED)
        }
      }
    defaultCoverImage: file(relativePath: { eq: "logoInsightToolkit.png" }) {
        childImageSharp {
          gatsbyImageData(layout: FIXED)
        }
      }
    allJson(filter: {issue: {publications: {in: [$pub_id]}}}) {
      edges {
        node {
          issue {
            name
            issue_id
            publications
          }
        }
      }
    }
}
`;
