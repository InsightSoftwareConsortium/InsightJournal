import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import MuiLink from '@material-ui/core/Link';
import Box from '@material-ui/core/Box';
import { GatsbyImage } from "gatsby-plugin-image"

export default function JournalTechnology({ cartoon }) {
  return (
    <div>
      <Typography variant="subtitle2" paragraph={true}>
        Sustainable open science with the power of Web3 technology!
      </Typography>
      <Typography variant="overline" paragraph={true}>
        The Insight Journal 3 (IJ3) is an innovative undertaking to bring sustainability to reproducible research.
      </Typography>
      <Box sx={{ my: 4 }} align="center">
        <center><GatsbyImage image={cartoon.childImageSharp.gatsbyImageData} /></center>
        <Typography sx={{ mt: 6, mb: 3 }} color="text.secondary" align="center">
          It's Merkle trees all the way down.
        </Typography>
      </Box>
      <Typography variant="body1" paragraph={true}>
        The <emph>Insight Journal 3 (IJ3)</emph> applies <MuiLink target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=l44z35vabvA">Web3</MuiLink> technologies based on the principles of <strong>verifiability, decentralization,</strong> and <strong>incentive engineering</strong> to achieve these goals. 
      </Typography>
    </div>
  )
}
