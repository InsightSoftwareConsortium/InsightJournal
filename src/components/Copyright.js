import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import MuiLink from '@mui/material/Link';
import kitwareLogo from '../assets/logoKitware.png';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Copyright() {
  return (
    <StaticQuery
      query={graphql`
        query CopyrightQuery {
          site {
            siteMetadata {
              copyrightHolder
            }
          }
        }
      `}
      render={data => (
  <Container maxWidth="sm">
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
      {'Copyright © '}{ data.site.siteMetadata.copyrightHolder }{' '}
      {new Date().getFullYear()}
      <br/>
      This work is licensed under a{' '}
      <MuiLink
        color="inherit"
        rel="license"
        href="https://creativecommons.org/licenses/by/4.0/"
      >
        Creative Commons Attribution 4.0 International License
      </MuiLink>
      {'. '}
    </Typography>
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
        <MuiLink color="inherit" href="https://github.com/InsightSoftwareConsortium/InsightJournal">
            <GitHubIcon fontSize="large" />
        </MuiLink>
    </Typography>
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
      Site developed by{' '}
      <MuiLink color="inherit" href="https://www.kitware.com/">
        Kitware, Inc.
      </MuiLink>{' '}
    </Typography>
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
        <MuiLink color="inherit" href="https://www.kitware.com/">
          <img src={kitwareLogo} alt="Kitware, Inc" />
        </MuiLink>
    </Typography>
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
      <MuiLink color="inherit" href="https://www.kitware.com/privacy/#privacy-policy">
        Privacy Notice
      </MuiLink>
    </Typography>
  </Container>
      )}
    />
  )
}
