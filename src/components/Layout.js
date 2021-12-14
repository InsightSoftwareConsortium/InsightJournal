import * as React from 'react';
import PropTypes from 'prop-types'

import Header from './Header'
import Copyright from './Copyright';
import SnackbarContent from '@mui/material/SnackbarContent';
import Button from '@mui/material/Button';
import Link from '../components/Link';

const provideFeedback = (
  <Link to="https://github.com/InsightSoftwareConsortium/InsightJournal/issues">
    <Button color="secondary" size="small">
      Provide Feedback
    </Button>
  </Link>
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
