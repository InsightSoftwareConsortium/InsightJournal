import axios from "axios";
import React, { Suspense } from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@mui/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import theme from '../theme';
import Link from '../components/Link';
import Layout from '../components/Layout';
import Citation from '../components/Citation';
import { GatsbyImage } from "gatsby-plugin-image"
import MuiLink from '@mui/material/Link';
import targetJournalLogo from '../components/targetJournalLogo';
import PublicationsIcon from '@mui/icons-material/LocalLibrary';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import Tab from '@mui/material/Tab';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import FormControl from '@mui/material/FormControl';
import uint8arrays from 'uint8arrays';
import { Base64 } from 'js-base64';
//import DownloadIcon from '@mui/icons-material/CloudDownload';
import FolderIcon from '@mui/icons-material/Folder';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/GetApp';
import ZipDownloadIcon from '@mui/icons-material/Archive';
import { DataGrid } from '@mui/x-data-grid';
import { saveAs } from 'file-saver';
import { lazy } from "@loadable/component"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ipfs from '../ipfs/ipfsClient.js';
import getLinks from '../ipfs/getLinks.js';
import saveFileCID from '../ipfs/saveFileCID.js';
import saveFileZipCID from '../ipfs/saveFileZipCID.js';
import saveDirectoryZipCID from "../ipfs/saveDirectoryZipCID.js";

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
  treeRoot: {
    height: 240,
    flexGrow: 1,
    maxWidth: 400,
  },
  fileTreeTable: {
    height: 440,
  },
  sourceCodeDownload: {
    paddingTop:"20px",
    paddingBottom:"15px",
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  downloadWrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  fileContent: {
    maxHeight: 600,
    overflowY: "auto !important",
  },
  noMaxWidth: {
    maxWidth: 'none',
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

async function showFileContents(ipfs, cid, name, setFileContent) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
    const chunkNum = `${chunks.length}`
    setFileContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading chunk ${chunkNum}`} /></>)
  }
  const file = uint8arrays.concat(chunks)
  const code = new TextDecoder().decode(file)
  setFileContent(
    <SyntaxHighlighter showLineNumbers={true} wrapLines={true} style={docco}>
      {code}
    </SyntaxHighlighter>
  )
}

async function sourceCodeTreeRows(sourceCodeCid, treePath) {
  const links = await getLinks(`/ipfs/${sourceCodeCid}/${treePath.slice(1).join('/')}`)
  const treeRows = links.map((link) => {
    return { type: link.type, name: link.name, size: link.size, id: link.path, cid: link.cid }
  })
  return treeRows
}

async function loadArticle(articlesCid, publication, revision, setArticleContent) {
  const articleCid = publication.revisions[revision].article
  if (!articleCid) {
    setArticleContent(<><Typography m={2}>Article not found.</Typography></>)
  } else {
    setArticleContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading article`} /></>)
    const pinataArticleUrl = `https://itk.mypinata.cloud/ipfs/${articlesCid}/ij-articles/${publication.publication_id}/${revision+1}/article.pdf`
    const getPinata = axios.get(pinataArticleUrl, { responseType: 'arraybuffer' })
    const dwebArticleUrl = `https://${articlesCid}.ipfs.dweb.link/ij-articles/${publication.publication_id}/${revision+1}/article.pdf`
    const getDweb = axios.get(dwebArticleUrl, { responseType: 'arraybuffer' })
    const response = await Promise.race([getPinata, getDweb])
    setArticleContent(<><LinearProgressWithLabel color="primary" variant="determinate" value={100} label={`loading complete`} /></>)
    const pdf = new Uint8Array(response.data)
    const pdfBlob = new Blob([pdf.buffer])
    const pdfBase64 = Base64.fromUint8Array(pdf)
    const titleForFile = publication.title.split(' ').join('_')
    setArticleContent(<><Suspense fallback={<div>Loading</div>}><LoadablePDFViewer scale={1.4} minScale={1} maxScale={5} scaleStep={0.4} document={{ base64: pdfBase64 }} showThumbnail={{ scale: 1 }} /><Button onClick={() => { saveAs(pdfBlob, `IJ-${publication.publication_id}-${titleForFile}.pdf`)}} startIcon={<DownloadIcon />} variant="contained">Download PDF</Button></Suspense></>)
  }
}

async function loadSourceCode(ipfs, publication, revision, setSourceCodeContent, setFileContent, classes) {
  const sourceCodeCid = publication.revisions[revision].source_code
  if (!sourceCodeCid) {
    setSourceCodeContent(<><Typography m={2}>Source code not found.</Typography></>)
  } else {

    const links = await getLinks(`/ipfs/${sourceCodeCid}`)

    const rows = links.map((link) => {
      return { type: link.type, name: link.name, size: link.size, id: link.path, cid: link.cid }
    })
    let treePath = ['<root>']

    const columns = [
      {
        field: 'type',
        headerName: 'Type',
        disableColumnMenu: true,
        width: 40,
        renderCell: (params) => {
          if (params.value === "file") {
            return (<FileIcon />)
          }
          return (<FolderIcon />)
        },
      },
      {
        field: 'name',
        headerName: 'Name',
        width: 440,
        renderCell: (params) => {
          return (
          <div>
            <Typography variant="body1" style={{ whitespace: 'normal', wordwrap: "break-word" }} >{params.value}</Typography>
          </div>
        )
        }
      },
      { field: 'size',
        headerName: 'Size',
        description: 'Size (bytes)',
        width: 120,
        renderCell: (params) => {
          if (params.value > 0) {
            return (
            <div>
            <Typography variant="body2" style={{ whitespace: 'normal', wordwrap: "break-word" }} >{params.value}</Typography>
            </div>
            )
          }
          return (<div />)
        }
      },
      {
        field: 'download',
        disableColumnMenu: true,
        headerName: ' ',
        description: 'Download',
        width: 60,
        renderCell: (params) => {
          if (params.row.type === 'dir') {
            return (<></>)
          }
          return (<DownloadIcon onClick={() => {saveFileCID(params.row.cid, params.row.name)}} />)
        },
      },
      {
        field: 'zipdownload',
        disableColumnMenu: true,
        disableColumnSelector: true,
        headerName: ' ',
        description: 'Download as a Zip archive',
        width: 60,
        renderCell: (params) => {
          if (params.row.type === 'dir') {
            return (<ZipDownloadIcon onClick={() => {saveDirectoryZipCID(params.row.cid, params.row.name)}} />)
          }
          return (<ZipDownloadIcon onClick={() => {saveFileZipCID(params.row.cid, params.row.name, 0)}} />)
        },
      },
      {
        field: 'cid',
        description: 'IPFS Content Identifier (CID)',
        disableColumnMenu: true,
        headerName: 'CID',
        width: 100,
        renderCell: (params) => {
          const short = `${params.value.substring(0, 8)}...`
          return (<Tooltip placement="left-start" title={params.value} aria-label="cid" classes={{ tooltip: classes.noMaxWidth }} interactive="true"><Typography>{short}</Typography></Tooltip>)
        },
      },
    ];

    function FullDownloadInterface() {
      const [chunksLoaded, setChunksLoaded] = React.useState(0);
      return (<div className={classes.downloadWrapper}>
        <Box className={classes.sourceCodeDownload}>
          <Button disabled={!!chunksLoaded} onClick={() => {saveDirectoryZipCID(sourceCodeCid, titleForFile, setChunksLoaded)}} startIcon={<DownloadIcon />} variant="contained">Download Source Code</Button>
          {!!chunksLoaded && <CircularProgress size={24} color="secondary" value={chunksLoaded} className={classes.buttonProgress} />}
        </Box>
          {publication.source_code_git_repo && <Box><Typography><code>git clone <MuiLink target="_blank" href={publication.source_code_git_repo}>{publication.source_code_git_repo}</MuiLink></code></Typography></Box>}
      </div>)
    }

    async function renderTreePath(path) {
      const treeRows = await sourceCodeTreeRows(sourceCodeCid, path)
      treePath = path
      setNestedSourceCodeContent(path, treeRows)
    }
    function setNestedSourceCodeContent(path, treeRows) {
      setSourceCodeContent(
        <>
        <Box className={classes.fileTreeTable}>
          <DataGrid disableColumnReorder={true} hideFooterSelectedRowCount={true} headerHeight={42} rowHeight={42} rows={treeRows} columns={columns} rowsPerPageOptions={[8]} pageSize={8} onRowClick={onRowClick}/>
        </Box>
        <Breadcrumbs>
          {path.map((r, i) => {
            const pathSlice = path.slice(0, i+1)
            const onTreePathClick = () => renderTreePath(pathSlice)
            return (<Typography onClick={onTreePathClick} key={i}>{r}</Typography>)
          })}
        </Breadcrumbs>
        <FullDownloadInterface/>
        </>
      )
    }

    async function onRowClick(params) {
      if (isBrowser && params.row.type === 'file') {
        showFileContents(ipfs, params.row.cid, params.row.name, setFileContent)
      } else {
        treePath.push(params.row.name)
        const treeRows = await sourceCodeTreeRows(sourceCodeCid, treePath)
        setNestedSourceCodeContent(treePath, treeRows)
      }
    }

    const titleForFile = publication.title.split(' ').join('_')
    setSourceCodeContent(
      <>
      <Box className={classes.fileTreeTable}>
        <DataGrid disableColumnReorder={true} hideFooterSelectedRowCount={true} headerHeight={42} rowHeight={42} rows={rows} columns={columns} rowsPerPageOptions={[8]} pageSize={8} onRowClick={onRowClick}/>
      </Box>
      <FullDownloadInterface/>
      </>
    )
  }
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
  }
  let submit_inst = "";
  let submit_auth = "";
  if (publication.submitted_by_author) {
    submit_inst = publication.submitted_by_author.author_institution
    submit_auth = `${publication.submitted_by_author.author_firstname} ${publication.submitted_by_author.author_lastname}`
  }

  const coverImage = data.coverImage ? <GatsbyImage image={data.coverImage.childImageSharp.gatsbyImageData} alt="Publication cover image"/> : <img src={logo} alt={logoAlt} />

  const previousLink = pageContext.prev_id ? `/browse/publication/${pageContext.prev_id}` : `/browse/publication/${publication.publication_id}`
  const nextLink = pageContext.next_id ? `/browse/publication/${pageContext.next_id}` : `/browse/publication/${publication.publication_id}`

  let citeLink = ""
  let doiLink = ""
  if (publication.revisions && publication.revisions.length) {
    const numHandles = publication.revisions.length
    const handleURL = `http://hdl.handle.net/${publication.revisions[numHandles-1].handle}`
    citeLink = <Typography variant="subtitle1" align="center">Please use this identifier to cite or link to this publication: <MuiLink href={handleURL}>{handleURL}</MuiLink></Typography>
    const doi = publication.revisions[numHandles-1].doi
    // doi might be falsey (null, empty)
    if (doi) {
      const doiURL = `https://doi.org/${doi}`
      doiLink = <Typography variant="subtitle1" align="center"><strong>New:</strong> Prefer using the following doi: <MuiLink href={doiURL}>{doiURL}</MuiLink></Typography>
    }
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

  const [sourceCodeContent, setSourceCodeContent] = React.useState(<><LinearProgressWithLabel color="secondary" variant="indeterminate" label="loading..."/></>)

  const [fileContent, setFileContent] = React.useState(<></>)

  const [tab, setTab] = React.useState('1');
  const handleTabChange = (event, newValue) => {
    setTab(newValue)
    switch (newValue) {
    case '1':
      setFileContent(<></>)
      break
    case '2':
      loadArticle(data.site.siteMetadata.articlesCid, publication, revision, setArticleContent)
      setFileContent(<></>)
      break
    case '3':
      loadSourceCode(ipfs, publication, revision, setSourceCodeContent, setFileContent, classes)
      setFileContent(<></>)
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
        {doiLink}
        <Box component="div" className={classes.journal}><Typography variant="subtitle2"><PublicationsIcon />{' '}Published in <Link to="/">{data.site.siteMetadata.title}</Link>{issueLinks}.</Typography></Box>
        <Box component="div" className={classes.submittedBy} color="error">Submitted by {submit_auth} on {publication.date_submitted}.</Box>
        <TabContext value={tab}>
          <TabList indicatorColor="primary" textColor="primary" aria-label="publication component" onChange={handleTabChange}>
            <Tab label="Abstract" value="1" />
            <Tab label="Article" value="2" />
            <Tab label="Source Code" value="3" />
          </TabList>
          <TabPanel value="1"><Typography variant="body1">{publication.abstract}</Typography></TabPanel>
          <TabPanel value="2">{articleContent}</TabPanel>
          <TabPanel value="3">{sourceCodeContent}</TabPanel>
        </TabContext>
      </Box>
      <Box component="div" id="fileContent" className={classes.fileContent}>
       {fileContent}
      </Box>
      <br/>
    <Grid container justify='space-between' spacing={2}>
        <Grid item xs>
          <Citation publication={publication} journal={data.site.siteMetadata}/>
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
        source_code_git_repo
        revisions {
          article
          handle
          source_code
          doi
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
        articlesCid,
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
