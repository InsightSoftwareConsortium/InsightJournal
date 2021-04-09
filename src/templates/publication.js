import React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import theme from '../theme';
import Link from '../components/Link';
import Layout from '../components/Layout';
import { GatsbyImage } from "gatsby-plugin-image"
import MuiLink from '@material-ui/core/Link';
import targetJournalLogo from '../components/targetJournalLogo';

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

const Render = ({ data }) => {
  const classes = useStyles();
  const publication = data.json.publication;
  const allIssues = data.allJson.edges.filter(e => e.node.issue)
  const publicationIssues = allIssues.filter(e => e.node.issue.publications.includes(publication.publication_id))

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

  let citeLink = ""
  if (publication.handles && publication.handles.length) {
    const numHandles = publication.handles.length
    const handleURL = publication.handles[numHandles-1].handle_url
    citeLink = <Typography variant="subtitle1" align="center">Please use this identifier to cite or link to this publication: <MuiLink href={handleURL}>{handleURL}</MuiLink></Typography>
  }

  let issueLinks = ""
  // todo: add a link to issue page
  if (publicationIssues.length) {
    issueLinks = publicationIssues.map((issue) => {
      const name = issue.node.issue.name
      const issuePath = `/browse/issue/${issue.node.issue.issue_id}`
      return (<Link to={issuePath} key={name}> - {name}</Link>)
    })
  }


  return (
    <>
      <ThemeProvider theme={theme}>
        <Layout>
	<Box component="div"  id="publication">
	  <Box component="div"  className={classes.pubTitle}>
	    <Typography variant="h4" component="h1" align="center" color="primary.main">{publication.title}</Typography></Box>

	<Box component="div" color="secondary.main" className={classes.authors}>{ordered_authors.join(", ")}</Box>
    <Box component="div" color="secondary.main" className={classes.institution}><Typography variant="caption">{submit_inst}</Typography></Box>

	<center>{coverImage}</center>
	<br/>
        {citeLink}
    <Box component="div" className={classes.journal}><Typography variant="subtitle2">Published in <Link to="/">{data.site.siteMetadata.title}</Link>{issueLinks}.</Typography></Box>
	<Box component="div" className={classes.submittedBy} color="error">Submitted by {submit_auth} on {publication.date_submitted}.</Box>
        <Typography variant="body1">{publication.abstract}</Typography>
	</Box>
        </Layout>
      </ThemeProvider>
    </>
  );
};

export default Render;

export const query = graphql`
  query PublicationQuery($slug: String!, $cover: String!) {
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
        handles {
          handle_url
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
    allJson {
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
