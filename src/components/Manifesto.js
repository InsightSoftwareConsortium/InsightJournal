import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import MuiLink from '@material-ui/core/Link';

export default function Manifesto() {
  return (
    <div>
      <Typography variant="subtitle2" paragraph={true}>
        About the VTK Journal
      </Typography>
      <Typography variant="body1" paragraph={true}>
      The VTK Journal is a repository of documents, data, and source code which are relevant to the field of visualization, and the Visualization Toolkit (<MuiLink href="https://vtk.org/">vtk.org</MuiLink>) in particular. The VTK Journal is an open access journal, meaning that it supports the broader Open Science movement, in which the necessary information, data and methods are available to replicate and understand scientific (computational) experiments. The VTK Journal and other open access journals were created in response to the intellectual property boundaries found in conventional journals and supported by many researchers, that impede the free flow of information exchange necessary to the scientific method. (A more militant view of this can be found in the <MuiLink href="https://insight-journal.org/about/">description of the Insight Journal</MuiLink>).
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The VTK Journal is now archived and no longer accepting submissions. If you have data and source code and would like to submit it to a similar journal, please use the <MuiLink href="https://insight-journal.org/">Insight Journal</MuiLink>.
      </Typography>
    </div>
  )
}