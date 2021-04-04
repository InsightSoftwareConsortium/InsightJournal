Insight Journal
---------------

The Insight Journal is an on-line open science publication covering the domain of medical image processing and visualization.

The unique characteristics of the Insight Journal include:

- Open-access to articles, data, code, and reviews
- Open peer-review that invites discussion between reviewers and authors
- Emphasis on reproducible science via continuous integration testing
- Support for continuous revision of articles, code, and reviews

[![Netlify Status](https://api.netlify.com/api/v1/badges/2a241820-33ec-4c71-b43d-7d8a12e6ece3/deploy-status)](https://app.netlify.com/sites/insight-journal/deploys)

Powered by [Gatsby](https://www.gatsbyjs.org/)

Each publication is associated to a folder, where `metadata.json` stores information
such as title, abstract, doi, authors, tags, journal, toolkit, etc.

This file is parsed by gatsby to build the site. The final webpage is static.

Submissions and reviews will be handled by opening pull-request to this repo.
An unique identifier will be required for all submitting authors, prefering ORCID.

Blobs of data, such as pdfs, source code at the moment of submission, and other data is stored in
[data.kitware](https://data.kitware.com/#collection/5cb75e388d777f072b41e8db/folder/5cc782658d777f072b7834a2)


Dev notes:
--
Start with: material-ui template from: https://github.com/mui-org/material-ui/tree/next/examples/gatsby-next

