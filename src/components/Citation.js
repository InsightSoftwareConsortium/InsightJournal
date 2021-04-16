import * as React from 'react';

import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

export default function Citation({ publication }) {
  let citString = ""
  // lastnames: purely last name
  let last_names = [];
  let bibtext_names = [];
  let text_names = []
  let out_file = "";
  const authors = publication.authors

  const populateAuthors = (publication) => {
    const has_authors = publication.authors ? true : false;
    if (has_authors) {
      for (const author of authors) {
        if (author.persona_firstname) {
          last_names.push(author.persona_lastname)
          bibtext_names.push(`${author.persona_firstname[0]}. ${author.persona_lastname}`)
          text_names.push(`${author.persona_lastname} ${author.persona_firstname[0]}.`)
        } else {
          let names = author.author_fullname.split(", ")
          last_names.push(names[0])
          bibtext_names.push(`${names[1][0]}. ${names[0]}`)
          text_names.push(`${names[0]} ${names[1][0]}.`)
        }
      }
    }
  }

  populateAuthors(publication);
  const submission_date = new Date(publication.date_submitted)

  const generateXMLCitation = (publication) => {
    let citData = [`<?xml version="1.0" encoding="ISO-8859-1"?><Publications>`,
                `<Publication>`,
                `<AuthorList>`]
    for (const author of authors) {
      citData.push(`<Author>`)
      if (author.persona_firstname) {
        citData.push(`<LastName>${author.persona_lastname}</LastName>`)
        citData.push(`<FirstName>${author.persona_firstname}</FirstName>`)
      } else {
        citData.push(`${author.author_fullname}`)
      }
      citData.push(`</Author>`)
    }
    citData.push("</AuthorList>")
    citData.push(`<Title>${publication.title}</Title>`)
    citData.push(`<Abstract><AbstractText>
${publication.abstract}
</AbstractText></Abstract>`)

    citData.push(`<Location>${publication.handles[publication.handles.length-1].handle_url}</Location>"`)
    citData.push(`<Year>${submission_date.getFullYear()}</Year>`)
    citData.push(`<Month>${('0' + (submission_date.getMonth()+1)).slice(-2)}</Month>`)
    if(publication.submitted_by_author) {
      citData.push(`<Institution>${publication.submitted_by_author.author_institution}</Institution>`)
    }
    citData.push(`</Publication>`)
    citData.push(`</Publications>`)

    citString = citData.join("\n")
  }
  const generateMedlineCitation = (publication) => {
    let citData = [`PMID-`,`VI  -`]
    citData.push(`DP  - ${submission_date.getFullYear()} ${('0' + (submission_date.getMonth()+1)).slice(-2)}`)
    citData.push(`TI  - ${publication.title}`)
    citData.push(`PG  -`)
    citData.push(`AB  - ${publication.abstract}`)
    for (const author of authors) {
      citData.push(`FAU - ${author.author_fullname}`)
      if (author.persona_firstname) {
        citData.push(`AU  - ${author.persona_lastname} ${author.persona_firstname[0]}`)
      }
    }
    if(publication.submitted_by_author) {
      citData.push(`AD  - ${publication.submitted_by_author.author_institution}`)
    }

    citString = citData.join("\n")
  }
  const generateTextCitation = (publication) => {
    citString = `${text_names.join(", ")} ${publication.title}. ${submission_date.getFullYear()} ${submission_date.toLocaleString('default', { month: 'short' })}.`
  };
  const generateBibTextCitation = (publication) => {

    let citData = [`@comment{This file has been generated}`]

    citData.push(`@Article{${last_names.join("+")}${submission_date.getFullYear()}`)
    citData.push(`Authors = "${bibtext_names.join(" and ")}",`)
    citData.push(`Title = "${publication.title}",`)
    citData.push(`howpublished = "\\url{${publication.handles[publication.handles.length-1].handle_url}}",`)
    citData.push(`Year = ${submission_date.getFullYear()},`)
    citData.push(`Month = ${('0' + (submission_date.getMonth()+1)).slice(-2)},`)
    citData.push(`Abstract = "${publication.abstract}",`)
    if(publication.submitted_by_author) {
      citData.push(`Institution = "${publication.submitted_by_author.author_institution}",`)
    }
    // Keyword information goes here
    citData.push("}")
    citString = citData.join("\n")
  };
  generateBibTextCitation(publication);
  const handleTypeChange = (event) => {
    switch (event.target.value) {
      case "bibtex":
        generateBibTextCitation(publication);
        out_file='bibtex.bib'
        break;
      case "text":
        generateTextCitation(publication);
        out_file='References.txt'
        break;
      case "medline":
        generateMedlineCitation(publication);
        out_file='publications.txt'
        break;
      case "xml":
        generateXMLCitation(publication);
        out_file='publications.xml'
        break;
      default:

    }
  };


  const exportCitation = () => {
    let data = new Blob([citString], {type: 'text/plain'});
    let citURL = window.URL.createObjectURL(data);
    let tempLink = document.createElement('a');
    tempLink.href = citURL;
    tempLink.setAttribute('download', out_file);
    tempLink.click();
  };
  return (
        <div>
          <label htmlFor="citationSelect" >Export Citation:  </label>
          <Select id="citationSelect" defaultValue="bibtex" onChange={handleTypeChange}>
            <MenuItem value='bibtex'>BibTex</MenuItem>
            <MenuItem value='text'>Text</MenuItem>
            <MenuItem value='medline'>Medline</MenuItem>
            <MenuItem value='xml'>XML</MenuItem>
          </Select>
          <Button aria-haspopup="true" onClick={exportCitation}>EXPORT</Button>
        </div>
  )
}
