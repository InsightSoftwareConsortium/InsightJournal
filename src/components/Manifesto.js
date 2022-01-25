import * as React from 'react';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import { GatsbyImage } from "gatsby-plugin-image"

export default function Manifesto({ galileo }) {
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
      <Typography variant="body1" paragraph={true}>
      The concept of publish or perish is corrupt in its essence and denigrates the natural altruist motivation to perform scientific research. Of course, the motto's results are convenient for those organizations that derive a significant part of their revenue from the administration of the publishing process. Ironically, those organizations are typically technical and scientific societies. As a result, they have become the strongest opponents of the Open Access Revolution. This retrograde attitude of scientific societies is clearly illustrated by the dismissal of a Nobel Prize winner from the American Chemical Society in response to the greedy attitude of the ACL to prevent the public online publication of a chemical database by the National Library of Medicine.
      </Typography>
      <Typography variant="body1" paragraph={true}>
       The real reason why researchers seek to publish today is because they are expected to have publications in their resumes. There is an implicit understanding that a certain number of publications per year are expected to be produced by every researcher. Researchers who do not fill up those unstated quotas are considered to be unfit for research or simply unproductive.
       The <strong>number</strong> of publications in your CV (not their quality, nor relevance, nor impact) is considered when you as a researcher seek to obtain:
       <List disablePadding={true}>
         <ListItem><ListItemText primary="A degree"></ListItemText></ListItem>
         <ListItem><ListItemText primary="A job in industry or academia"></ListItemText></ListItem>
         <ListItem><ListItemText primary="A tenure position in a university"></ListItemText></ListItem>
         <ListItem><ListItemText primary="A promotion"></ListItemText></ListItem>
         <ListItem><ListItemText primary="A grant from federal or state agencies"></ListItemText></ListItem>
       </List>
      </Typography>
      <Typography variant="body1" paragraph={true}>
      The Scientific Method was introduced by Galileo in the 1500's when he embarqued on a series of attempts to answer fundamental questions about physics by performing experiments.
      </Typography>
      <Box sx={{ my: 4 }} align="center">
        <center><GatsbyImage image={galileo.childImageSharp.gatsbyImageData} /></center>
        <Typography sx={{ mt: 6, mb: 3 }} color="text.secondary" align="center">
          Galileo Portrait by Sustermans.
        </Typography>
      </Box>
      <Typography variant="body1" paragraph={true}>
      Galileo was also at the center of the first Scientific Journal, which was published by the "Linceans", also known as the Society of the Lynx. The name of the society derived from the acute view of this animal which conveys the idea that careful observation of experiment was required for finding the truth about scientific matters.
      </Typography>
    </div>
  )
}
