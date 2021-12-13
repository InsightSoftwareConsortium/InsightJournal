import * as React from 'react';
import Typography from '@material-ui/core/Typography';

export default function Manifesto() {
  return (
    <div>
      <Typography variant="subtitle2" paragraph={true}>
        The Insight Journal and the Scientific Method!
      </Typography>
      <Typography variant="overline" paragraph={true}>
        The Insight Journal seeks to provide a realistic support for the endeavor of scientific research in the domain of medical image processing.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The main motivation for creating the Journal was the insufficiency of the current publications in this domain. Most of those other publications' main purpose is to support the evaluation of scientific productivty for institutions where researchers are employed and for those institutions that provide research funds.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        The delusional character of the current publishing system is clearly visible in its motto:
      </Typography>
      <Typography align="center" color="textSecondary" variant="body1" paragraph={true}>
        "Publish or Perish!"
      </Typography>
      <Typography variant="body1" paragraph={true}>
        Note that it does not say:
      </Typography>
      <Typography align="center" color="textSecondary" variant="body1" paragraph={true}>
        "Research or Perish!"
      </Typography>
      <Typography variant="body1" paragraph={true}>
        This nuance have resulted in the inversion of roles where researchers do work <strong>"in order to publish it"</strong>, not because that research work has a significant impact on their society. As a consequence, researchers only embark on publisheable activities, which of course does not include any significant depart from the views currently held by the establishment of Experts who serve as reviewers of journals.
      </Typography>
    </div>
  )
}