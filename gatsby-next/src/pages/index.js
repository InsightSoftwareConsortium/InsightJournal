import * as React from 'react';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
import Link from '../components/Link';
import Copyright from '../components/Copyright';

export default function Index() {
  return (
    // TODO v5: remove once migration to emotion is completed
    <StyledEngineProvider injectFirst>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gatsby v5-alpha example
          </Typography>
          <Link to="/about" color="secondary">
            Go to the about page
          </Link>
          <ProTip />
          <Copyright />
        </Box>
      </Container>
    </StyledEngineProvider>
  );
}
