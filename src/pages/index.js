import * as React from 'react';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
// import Link from '../components/Link';
import Copyright from '../components/Copyright';
import {Logo, Title} from '../components/LogoTitle'

export default function Index() {
  return (
    // TODO v5: remove once migration to emotion is completed
    <StyledEngineProvider injectFirst>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Logo targetJournal="Insight"/>
          <Title targetJournal="Insight"/>
          <ProTip />
          <Copyright />
        </Box>
      </Container>
    </StyledEngineProvider>
  );
}
