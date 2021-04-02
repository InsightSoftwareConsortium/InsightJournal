import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Title from './Title';
import Logo from './Logo';

const Header = () => {
  return (
    <StaticQuery
      query={graphql`
        query HeaderSiteTitleQuery {
          site {
            siteMetadata {
              targetJournal,
              title
            }
          }
        }
      `}
      render={data => (
        <div>
        <Title siteTitle={ data.site.siteMetadata.title }/>
        <Logo targetJournal={ data.site.siteMetadata.targetJournal }/>
        </div>
      )}
    />
  );
}

export default Header
