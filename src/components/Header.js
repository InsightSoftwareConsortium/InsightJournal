import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Title from './Title';
import Logo from './Logo';
import JournalMenuButton from './JournalMenuButton'

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

        <div align="center">
        <Title siteTitle={ data.site.siteMetadata.title }/>
        <Logo targetJournal={ data.site.siteMetadata.targetJournal }/>
        {JournalMenuButton("Home",[], ["/"])}
        {JournalMenuButton("Submit",[], [])}
        {JournalMenuButton("Help",[], ["/help"])}
        </div>
      )}
    />
  );
}

export default Header
