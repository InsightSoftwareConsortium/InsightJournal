import React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import theme from '../theme';
import Img from "gatsby-image"
import targetJournalLogo from '../components/targetJournalLogo';

const useStyles = makeStyles({
	pubTitle: {
	  fontSize:"120%",
	  fontWeight:"bold",
	  textAlign:"center",
	  paddingBottom:"10px",
	},
	journal: {
	  paddingTop:"10px",
	},

	submittedBy: {
	  paddingTop:"10px",
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

const Render = ({ data }) => {
  const classes = useStyles();
  const publication = data.json.publication;
  console.log(data)
  console.log(publication)
  const targetJournal = data.site.siteMetadata.targetJournal
  const { logo, logoAlt } = targetJournalLogo(targetJournal)
  const has_authors = publication.authors ? true : false;
  const ordered_authors = [];
  if (has_authors) {
    for (const author of publication.authors) {
      if (author.persona_firstname) {
	      var author_str = author.persona_lastname
	      author_str +=  " " + author.persona_firstname[0];
	      ordered_authors.push(author_str);
      } else {
        ordered_authors.push(author.author_fullname)
      }
    }
    ordered_authors.sort();
  }
  let submit_inst = "";
  let submit_auth = "";
  if( publication.submitted_by_author) {
    submit_inst = publication.submitted_by_author.author_institution
    submit_auth = `${publication.submitted_by_author.author_firstname} ${publication.submitted_by_author.author_lastname}`
  }

  const coverImage = data.coverImage ? <Img fixed={data.coverImage.childImageSharp.fixed} /> : <img src={logo} alt={logoAlt} />
  //const first_author = has_authors
    //? publication.authors[0].author_fullname
    //: "No author";
  return (
    <>
      <ThemeProvider theme={theme}>
	<Box component="div"  id="publication">
	  <Box component="div"  className={classes.pubTitle}>
	    <Typography color="primary.main"> {publication.title}</Typography></Box>

	<Box component="div" color="secondary.main" className={classes.authors}>{ordered_authors.join(",")}</Box>
	<Box component="div" color="secondary.main" className={classes.institution}>{submit_inst}</Box>

	<center>{coverImage}</center>
	<br/>
	<table align="center"><tbody><tr><td  className="colortable" >
	Please use this identifier to cite or link to this publication:
	</td></tr></tbody></table>
	<Box component="div" className={classes.journal}></Box>
	<Box component="div" className={classes.submittedBy} color="error">Submitted by {submit_auth} on {publication.date_submitted}.</Box>
	<Box component="div" className="abstract">{publication.abstract}</Box>
	<Box component="div" className="reviews">Data</Box>
	<Box component="div" id="Data">{}</Box>
	<Box component="div" className="review_header">{}</Box>
	<Box component="div" className="abstract">{}</Box>
	</Box>
      </ThemeProvider>
    </>
  );
};

export default Render;

export const query = graphql`
  query Metadata($slug: String!, $cover: String!) {
    json(fields: { slug: { eq: $slug } }) {
      publication {
        title
        abstract
        date_submitted
        authors {
          author_fullname
          persona_firstname
          persona_lastname
          author_place
        }
        submitted_by_author {
          author_institution
          author_firstname
          author_lastname
        }
        id
      }
    }
    site {
      siteMetadata {
        targetJournal
      }
    }
    coverImage: file(relativePath: { eq: $cover }) {
        childImageSharp {
          fixed(width: 300) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    defaultCoverImage: file(relativePath: { eq: "logoInsightJournal.png" }) {
        childImageSharp {
          fixed(width: 300) {
            ...GatsbyImageSharpFixed
          }
        }
      }
  }
`;
