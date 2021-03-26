import * as React from 'react';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
// import Link from '../components/Link';
import Copyright from '../components/Copyright';
import Logo from '../components/Logo';
import Title from '../components/Title';
import { graphql } from "gatsby"

export default function Index({ data }) {
  const targetJournal = data.site.siteMetadata.targetJournal
  return (
    // TODO v5: remove once migration to emotion is completed
    <StyledEngineProvider injectFirst>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Logo targetJournal={ targetJournal }/>
          <Title targetJournal={ targetJournal }/>
          <ProTip />
          <Copyright />
        </Box>
      </Container>
    </StyledEngineProvider>
  );
}

export const query = graphql`
  query {
    site {
      siteMetadata {
        targetJournal
      }
    }
  }
`
