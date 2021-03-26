import React from "react";
import { graphql } from "gatsby";

const Render = ({ data }) => {
  const publication = data.publication;
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
      ordered_authors.push([author.author_place, author.author_fullname]);
    }
    ordered_authors.sort();
    console.log(ordered_authors);
  }

  const first_author = has_authors
    ? publication.authors[0].author_fullname
    : "No author";
  return (
    <div>
      <h1>{publication.title}</h1>
      <h2>Data: </h2>
      <h2>First Author: {first_author}</h2>
    </div>
  );
};

export default Render;

export const query = graphql`
  query($slug: String!) {
    publication(fields: { slug: { eq: $slug } }) {
      title
      authors {
        author_fullname
        author_place
      }
      publication_id
    }
  }
`;
