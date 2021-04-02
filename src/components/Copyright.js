import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import MuiLink from '@material-ui/core/Link';
import kitwareLogo from '../assets/logoKitware.png';

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
      {new Date().getFullYear()}{'. '}
      <br/>
      This work is licensed under a{' '}
      <MuiLink
        color="inherit"
        rel="license"
        href="https://creativecommons.org/licenses/by/4.0/"
      >
        Creative Commons Attribution 4.0 International License
      </MuiLink>
      .
    </Typography>
    <Typography paragraph={true} variant="body2" color="text.secondary" align="center">
      <br/>
      Site developed by{' '}
      <MuiLink color="inherit" href="https://www.kitware.com/">
        Kitware, Inc.
      </MuiLink>{' '}
        <p><MuiLink color="inherit" href="https://www.kitware.com/">
          <img src={kitwareLogo} alt="Kitware, Inc" /></MuiLink></p>
      <MuiLink color="inherit" href="https://www.kitware.com/privacy/#privacy-policy">
        Privacy Notice
      </MuiLink>
     {'.'}
    </Typography>
  </Container>
      )}
    />
  )
}
