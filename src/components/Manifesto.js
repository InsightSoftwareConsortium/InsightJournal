import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import MuiLink from '@material-ui/core/Link';

export default function Manifesto({ galileo }) {
  return (
    <div>
      <Typography variant="subtitle2" paragraph={true}>
        About the MIDAS Journal
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The <strong>MIDAS Journal</strong> seeks to provide a realistic support for the endeavor of scientific research. 
      </Typography>
      <Typography variant="body1" paragraph={true}>
      The <strong>MIDAS Journal</strong> is using the same web development platform and concept as the <MuiLink href="https://insight-journal.org/">Insight Journal</MuiLink>. However, The MIDAS Journal doesn't require any source code or data as part of the submissions.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The <strong>MIDAS Journal</strong> is now archived and no longer accepting submissions. If you have data and source code and would like to submit it to a similar journal, please use the <MuiLink href="https://insight-journal.org/">Insight Journal</MuiLink>.
      </Typography>
    </div>
  )
}
