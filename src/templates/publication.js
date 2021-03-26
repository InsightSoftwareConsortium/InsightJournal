import React from "react";
import { graphql } from "gatsby";
import { makeStyles } from '@material-ui/core/styles';

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
  const publication = data.publication;
  console.log(data)
  console.log(publication)
  const has_authors = publication.authors ? true : false;
  // var ordered_authors = publication.authors
  // console.log(ordered_authors)
  // ordered_authors.sort(function(a,b){
  //   return a.author_place > b.author_place;
  // })
  // console.log(ordered_authors)
  // console.log("Sorted", publication.authors)
  var ordered_authors = [];
  if (has_authors) {
    for (const author of publication.authors) {
      console.log(author);
      if (author.persona_firstname) {
	      var author_str = author.persona_lastname
	      author_str +=  " " + author.persona_firstname[0];
	      console.log(author_str)
	      ordered_authors.push(author_str);
      } else {
        ordered_authors.push(author.author_fullname)
      }
    }
    ordered_authors.sort();
    console.log(ordered_authors);
  }
  var submit_inst = "";
  var submit_auth = "";
  if( publication.submitted_by_author) {
    submit_inst = publication.submitted_by_author.author_institution
    submit_auth = publication.submitted_by_author.author_firstname + " "+ publication.submitted_by_author.author_lastname
  } 
  const first_author = has_authors
    ? publication.authors[0].author_fullname
    : "No author";
  console.log(publication.abstract)    
  return (
    <>
	<div id="publication">
	  <div className={classes.pubTitle}>{publication.title}</div>

	<div className={classes.authors}>{ordered_authors.join(",")}</div>
	<div className={classes.institution}>{submit_inst}</div>

	<center>
	 <img className="thumbnail" src="" alt="logo" /></center>
	<br/>
	<table align="center"><tbody><tr><td  className="colortable" >
	Please use this identifier to cite or link to this publication:
	</td></tr></tbody></table>
	<div className={classes.journal}></div>
	<div className={classes.submittedBy}>Submitted by {submit_auth} on {publication.date_submitted}.</div>
	<div className="abstract">{publication.abstract}</div>
	</div>
    </>
  );
};

export default Render;

export const query = graphql`
  query($slug: String!) {
    publication(fields: { slug: { eq: $slug } }) {
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
      publication_id
    }
  }
`;
