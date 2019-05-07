import React from "react"
import { graphql } from "gatsby"

export default ({data}) => {
  const publication = data.publication
  // var ordered_authors = publication.authors
  // console.log(ordered_authors)
  // ordered_authors.sort(function(a,b){
  //   return a.author_place > b.author_place;
  // })
  // console.log(ordered_authors)
  // console.log("Sorted", publication.authors)
  var ordered_authors = []
  for (var author of publication.authors) {
    console.log(author)
    ordered_authors.push([author.author_place, author.author_fullname])
  }
  ordered_authors.sort()
  console.log(ordered_authors)
  return (
    <div>
      <h1>{publication.title}</h1>
      <h2>Data: {publication.authors[0].author_fullname}</h2>
      <h2>Sorted: {ordered_authors[0][1]}</h2>
    </div>
  )
}

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
`
