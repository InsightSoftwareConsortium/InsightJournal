import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import MuiLink from '@material-ui/core/Link';

export default function JournalTechnology() {
  return (
    <div>
      <Typography variant="subtitle2" paragraph={true}>
        Sustainable open science with the power of Web3 technology!
      </Typography>
      <Typography variant="overline" paragraph={true}>
        The Insight Journal 3 (IJ3) is an innovative undertaking to bring sustainability to reproducible research.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The <emph>Insight Journal 3 (IJ3)</emph> applies <MuiLink href="https://www.youtube.com/watch?v=l44z35vabvA">Web3</MuiLink> technologies that are based on the principles of <strong>verifiability, decentralization,</strong> and <strong>incentive engineering</strong>. 
      </Typography>
    </div>
  )
}
