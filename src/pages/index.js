import * as React from 'react';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
// import Link from '../components/Link';
import Layout from '../components/Layout';

export default function Index({ data }) {
  return (
    <StyledEngineProvider injectFirst>
      <Layout>
        <Container maxWidth="sm">
          <Box sx={{ my: 4 }}>
            <ProTip />
          </Box>
        </Container>
      </Layout>
    </StyledEngineProvider>
  );
}
