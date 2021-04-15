import * as React from 'react';
import PropTypes from 'prop-types'

import Header from './Header'
import Copyright from './Copyright';

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
