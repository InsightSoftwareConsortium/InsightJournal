import * as React from 'react';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import Link from '../components/Link';
import Copyright from '../components/Copyright';
import { GatsbyImage } from "gatsby-plugin-image"
import { graphql } from 'gatsby'

function LightBulbIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
    </SvgIcon>
  );
}

export default function NotFound({ data }) {
  return (
    // TODO v5: remove once migration to emotion is completed
    <StyledEngineProvider injectFirst>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Page not found.
          </Typography>
          <Link to="/">Go to the main page</Link>

        </Box>
        <Box sx={{ my: 4 }} align="center">
          <GatsbyImage image={data.file.childImageSharp.gatsbyImageData} />
          <Typography sx={{ mt: 6, mb: 3 }} color="text.secondary" align="center">
            <LightBulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Keep up the inquiry, friend
          </Typography>
          <Copyright />
        </Box>
      </Container>
    </StyledEngineProvider>
  );
}

export const query = graphql`
  query {
    file(relativePath: { eq: "titan.png"}) {
      childImageSharp {
        gatsbyImageData(layout: FIXED, width: 200, height: 225)
        }
      }
    }
`
