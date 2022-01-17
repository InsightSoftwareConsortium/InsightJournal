import React, { Suspense } from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/styles';
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
import CircularProgress from '@material-ui/core/CircularProgress';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import FormControl from '@material-ui/core/FormControl';
import useIpfsFactory from '../hooks/use-ipfs-factory.js'
import pWaitFor from 'p-wait-for';
import uint8arrays from 'uint8arrays';
import { Base64 } from 'js-base64';
//import DownloadIcon from '@material-ui/icons/CloudDownload';
import FolderIcon from '@material-ui/icons/Folder';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import DownloadIcon from '@material-ui/icons/GetApp';
import ZipDownloadIcon from '@material-ui/icons/Archive';
import { DataGrid } from '@material-ui/data-grid';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { lazy } from "@loadable/component"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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

async function saveFileCID(ipfs, cid, name) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
    //const chunkNum = `${chunks.length}`
    //setArticleContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading chunk ${chunkNum}`} /></>)
  }
  const file = uint8arrays.concat(chunks)
  const fileBlob = new Blob([file.buffer])
  saveAs(fileBlob, name)
}

async function saveFileZipCID(ipfs, cid, name) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
    //const chunkNum = `${chunks.length}`
    //setArticleContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading chunk ${chunkNum}`} /></>)
  }
  const file = uint8arrays.concat(chunks)
  const zip = new JSZip()
  zip.file(name, file)
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${name}.zip`)
  })
}

async function saveFileZip(ipfs, zip, path, cid, chunksLoaded, setChunksLoaded) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    setChunksLoaded && setChunksLoaded(chunksLoaded++)
    chunks.push(chunk)
  }
  const file = uint8arrays.concat(chunks)
  zip.file(path, file)
  return chunksLoaded
}

async function saveDirectoryZip(ipfs, zip, prefix, cid, chunksLoaded, setChunksLoaded) {
  setChunksLoaded && setChunksLoaded(chunksLoaded++)
  for await (const file of ipfs.ls(cid)) {
    const cid = file.cid.toString()
    if (file.type === 'dir') {
      chunksLoaded = await saveDirectoryZip(ipfs, zip, `${prefix}/${file.name}`, cid, chunksLoaded, setChunksLoaded)
    } else {
      chunksLoaded = await saveFileZip(ipfs, zip, `${prefix}/${file.name}`, cid, chunksLoaded, setChunksLoaded)
    }
  }
  return chunksLoaded
}

async function saveDirectoryZipCID(ipfs, cid, name, setChunksLoaded) {
  const zip = new JSZip()
  let chunksLoaded = 0
  await saveDirectoryZip(ipfs, zip, name, cid, chunksLoaded, setChunksLoaded)
  setChunksLoaded && setChunksLoaded(0)
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${name}.zip`)
  })
}

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

async function sourceCodeTreeRows(ipfs, revPath, treePath) {
  const treeRows = []
  for await (const file of ipfs.files.ls(`${revPath}/${treePath.slice(1).join('/')}`)) {
    const cid = file.cid.toString()
    treeRows.push({
      type: file.type,
      name: file.name,
      size: file.size,
      id: cid,
      cid,
    })
  }
  return treeRows
}

async function loadArticle(publication, revision, setArticleContent) {
  const articleCid = publication.revisions[revision].article
  if (!articleCid) {
    setArticleContent(<><Typography m={2}>Article not found.</Typography></>)
  } else {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${articleCid}`, { mode: 'cors', headers: { 'Content-Type': 'application/octet-stream' } })
    const reader = response.body.getReader();

    const chunks = []
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value)
      const chunkNum = `${chunks.length}`
      setArticleContent(<><LinearProgressWithLabel variant="indeterminate" color="secondary" label={`loading chunk ${chunkNum}`} /></>)
    }
    setArticleContent(<><LinearProgressWithLabel color="primary" variant="determinate" value={100} label={`loading complete`} /></>)
    const pdf = uint8arrays.concat(chunks)
    const pdfBlob = new Blob([pdf.buffer])
    const pdfBase64 = Base64.fromUint8Array(pdf)
    const titleForFile = publication.title.split(' ').join('_')
    setArticleContent(<><Suspense fallback={<div>Loading</div>}><LoadablePDFViewer scale={1.4} minScale={1} maxScale={5} scaleStep={0.4} document={{ base64: pdfBase64 }} showThumbnail={{ scale: 1 }} /><Button onClick={() => { saveAs(pdfBlob, `IJ-${publication.publication_id}-${titleForFile}.pdf`)}} startIcon={<DownloadIcon />} variant="contained">Download PDF</Button></Suspense></>)
  }
}

async function loadSourceCode(ipfs, isIpfsReady, publication, revision, setSourceCodeContent, setFileContent, classes) {
  const sourceCodeCid = publication.revisions[revision].source_code
  if (!sourceCodeCid) {
    setSourceCodeContent(<><Typography m={2}>Source code not found.</Typography></>)
  } else {
    await pWaitFor(() => isIpfsReady, { interval: 100 })
    const isOnline = await ipfs.isOnline()
    if (!isOnline) {
      await ipfs.start()
    }

    try {
      await ipfs.files.stat(`/sourceCodes/${publication.publication_id}`)
    } catch (error) {
      await ipfs.files.mkdir(`/sourceCodes/${publication.publication_id}`, { cidVersion: 1, parents: true })
    }

    const revPath = `/sourceCodes/${publication.publication_id}/${revision}`
    try {
      await ipfs.files.stat(revPath)
    } catch (error) {
      await ipfs.files.cp(`/ipfs/${sourceCodeCid}`, revPath, { cidVersion: 1 })
    }
    const rows = []
    for await (const file of ipfs.files.ls(revPath)) {
      const cid = file.cid.toString()
      rows.push({
        type: file.type,
        name: file.name,
        size: file.size,
        id: cid,
        cid,
      })
    }
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
          if (params.row.type === 'directory') {
            return (<></>)
          }
          return (<DownloadIcon onClick={() => {saveFileCID(ipfs, params.row.cid, params.row.name)}} />)
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
          if (params.row.type === 'directory') {
            return (<ZipDownloadIcon onClick={() => {saveDirectoryZipCID(ipfs, params.row.cid, params.row.name)}} />)
          }
          return (<ZipDownloadIcon onClick={() => {saveFileZipCID(ipfs, params.row.cid, params.row.name, 0)}} />)
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
          <Button disabled={!!chunksLoaded} onClick={() => {saveDirectoryZipCID(ipfs, sourceCodeCid, titleForFile, setChunksLoaded)}} startIcon={<DownloadIcon />} variant="contained">Download Source Code</Button>
          {!!chunksLoaded && <CircularProgress size={24} color="secondary" value={chunksLoaded} className={classes.buttonProgress} />}
        </Box>
          {publication.source_code_git_repo && <Box><Typography><code>git clone <MuiLink target="_blank" href={publication.source_code_git_repo}>{publication.source_code_git_repo}</MuiLink></code></Typography></Box>}
      </div>)
    }

    async function renderTreePath(path) {
      const treeRows = await sourceCodeTreeRows(ipfs, revPath, path)
      treePath = path
      setNestedSourceCodeContent(path, treeRows)
    }
    function setNestedSourceCodeContent(path, treeRows) {
      setSourceCodeContent(
        <>
        <Box className={classes.fileTreeTable}>
          <DataGrid disableColumnReorder={true} hideFooterSelectedRowCount={true} headerHeight={42} rowHeight={42} rows={treeRows} columns={columns} pageSize={8} onRowClick={onRowClick}/>
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
        const treeRows = await sourceCodeTreeRows(ipfs, revPath, treePath)
        setNestedSourceCodeContent(treePath, treeRows)
      }
    }

    const titleForFile = publication.title.split(' ').join('_')
    setSourceCodeContent(
      <>
      <Box className={classes.fileTreeTable}>
        <DataGrid disableColumnReorder={true} hideFooterSelectedRowCount={true} headerHeight={42} rowHeight={42} rows={rows} columns={columns} pageSize={8} onRowClick={onRowClick}/>
      </Box>
      <FullDownloadInterface/>
      </>
    )
  }
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
      loadArticle(publication, revision, setArticleContent)
      setFileContent(<></>)
      break
    case '3':
      loadSourceCode(ipfs, isIpfsReady, publication, revision, setSourceCodeContent, setFileContent, classes)
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
