import * as React from 'react';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
// import Link from '../components/Link';
import Paper from '@material-ui/core/Paper';
import Copyright from '../components/Copyright';
import logoInsightJournal from '../assets/logoInsightJournal.png';

export default function Index() {
  return (
    // TODO v5: remove once migration to emotion is completed
    <StyledEngineProvider injectFirst>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Paper elevation={0} align="center">
            <img src={logoInsightJournal} alt="logoInsightJournal" />
          </Paper>
          <Typography variant="h4" component="h1" align="center"gutterBottom>
            Insight Journal
          </Typography>
          <ProTip />
          <Copyright />
        </Box>
      </Container>
    </StyledEngineProvider>
  );
}
