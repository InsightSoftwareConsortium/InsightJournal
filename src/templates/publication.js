import React, { Suspense } from "react";
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
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import useIpfsFactory from '../hooks/use-ipfs-factory.js'
import pWaitFor from 'p-wait-for';
import uint8arrays from 'uint8arrays';
import { Base64 } from 'js-base64';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import { saveAs } from 'file-saver';
import { lazy } from "@loadable/component"

//const LoadablePDFViewer = lazy(() => import("../components/LoadablePDFViewer"))
const LoadablePDFViewer = lazy(() => import("pdf-viewer-reactjs"))

const useStyles = makeStyles({
  pubTitle: {
    fontWeight:"bold",
    textAlign:"center",
    paddingBottom:"10px",
  },
  journal: {
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
  revisionFormControl: {
    margin: theme.spacing(1),
    minWidth: 30,
  },
});

const revisionNumbers = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
]

function authorSort(a, b) {
  if (a.author_place < b.author_place) {
    return -1
  }
  if (a.author_place > b.author_place) {
    return 1
  }
  return 0
}

const isBrowser = typeof window !== "undefined"

function LinearProgressWithLabel(props) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="70%" mr={1}>
        <LinearProgress {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{props.label}</Typography>
      </Box>
    </Box>
  );
}

const Render = ({ data, pageContext }) => {
  if (isBrowser) {
    const preloadLink = document.createElement('link')
    preloadLink.href = "/ipfs-core.min.js"
    preloadLink.rel = "preload"
    preloadLink.as = "script"
    document.head.appendChild(preloadLink)
  }
  const { ipfs, isIpfsReady } = useIpfsFactory()
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

  const [articleContent, setArticleContent] = React.useState(<><LinearProgressWithLabel color="secondary" variant="indeterminate" label="loading..."/></>)
  const loadArticle = async () => {
    const articleCid = publication.revisions[revision].article
    if (!articleCid) {
      setArticleContent(<><Typography m={2}>Article not found.</Typography></>)
    } else {
      await pWaitFor(() => isIpfsReady, { interval: 100 })
      const isOnline = await ipfs.isOnline()
      if (!isOnline) {
        await ipfs.start()
      }

      try {
        await ipfs.files.stat(`/articles/${publication.publication_id}`)
      } catch (error) {
        await ipfs.files.mkdir(`/articles/${publication.publication_id}`, { cidVersion: 1, parents: true })
      }

      try {
        await ipfs.files.stat(`/articles/${publication.publication_id}/${revision}.pdf`)
      } catch (error) {
        await ipfs.files.cp(`/ipfs/${articleCid}`, `/articles/${publication.publication_id}/${revision}.pdf`, { cidVersion: 1 })
      }

      const chunks = []
      for await (const chunk of ipfs.files.read(`/articles/${publication.publication_id}/${revision}.pdf`)) {
        chunks.push(chunk)
        const chunkNum = `${chunks.length}`
        setArticleContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading chunk ${chunkNum}`} /></>)
      }
      setArticleContent(<><LinearProgressWithLabel color="primary" variant="determinate" value={100} label={`loading complete`} /></>)
      const pdf = uint8arrays.concat(chunks)
      const pdfBlob = new Blob([pdf.buffer])
      const pdfBase64 = Base64.fromUint8Array(pdf)
      const titleForFile = publication.title.split(' ').join('_')
      setArticleContent(<><Button onClick={() => { saveAs(pdfBlob, `IJ-${publication.publication_id}-${titleForFile}.pdf`)}} startIcon={<DownloadIcon />} variant="contained">Download PDF</Button><Suspense fallback={<div>Loading</div>}><LoadablePDFViewer scale={1.4} minScale={1} maxScale={5} scaleStep={0.4} document={{ base64: pdfBase64 }} showThumbnail={{ scale: 1 }} /></Suspense></>)
    }
  }

  const [tab, setTab] = React.useState('1');
  const handleTabChange = (event, newValue) => {
    setTab(newValue)
    switch (newValue) {
    case '1':
      break
    case '2':
      loadArticle()
      break
    default:
      console.error(`Encountered unsupported tab value: ${newValue}`)
    }
  }

  const [revision, setRevision] = React.useState(publication.revisions.length-1)
  const handleRevisionChange = (event) => {
    setRevision(event.target.value)
    handleTabChange({}, tab)
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
    <Grid container justify='space-between' spacing={2}>
        <Grid item xs>
          <Citation publication={publication} journalTitle={data.site.siteMetadata.title}/>
        </Grid>
        <Grid item xs>
          <FormControl variant="standard" margin="none" className={classes.revisionFormControl}>
            <InputLabel id="select-revision-label">Revision</InputLabel>
              <Select labelId="select-revision-label" id="select-revision" value={revision} onChange={handleRevisionChange}>
    {publication.revisions.map((r, i) => <MenuItem key={i} value={i}>{i < revisionNumbers.length ? revisionNumbers[i]: i}</MenuItem>)}
              </Select>
          </FormControl>
        </Grid>
      </Grid>
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
          article
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
