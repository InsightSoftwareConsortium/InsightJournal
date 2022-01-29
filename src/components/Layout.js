import * as React from 'react';
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet';

import Header from './Header'
import Copyright from './Copyright';
import SnackbarContent from '@mui/material/SnackbarContent';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';

const provideFeedback = (
  <MuiLink href="https://github.com/InsightSoftwareConsortium/InsightJournal/issues">
    <Button color="secondary" size="small">
      Provide Feedback
    </Button>
  </MuiLink>
);

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF' }}>
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0px 1.0875rem 1.45rem`,
          paddingTop: 40,
        }}
      >
      <Header />
      <Helmet>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest"/>
      </Helmet>
        <main>{children}</main>
        <SnackbarContent message="The journal is undergoing rebirth as a sustainable, modern website. We appreciate your thoughts and suggestions." action={provideFeedback} />
        <footer style={{ paddingTop: 80 }}>
          <Copyright />
        </footer>
      </div>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
