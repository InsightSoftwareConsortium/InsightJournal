import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Grid from '@material-ui/core/Grid';
import Title from './Title';
import Logo from './Logo';
import Search from './Search';
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
          },
          siteSearchIndex {
            index
          }
        }
      `}
      render={data => (
        <Grid container spacing={0}>
          <Grid item>
              <Logo targetJournal={ data.site.siteMetadata.targetJournal }/>
          </Grid>
          <Grid item>
              <Title siteTitle={ data.site.siteMetadata.title }/>
          </Grid>
          <Grid container spacing={3}>
            <Grid item>
                {JournalMenuButton("Home",[], ["/"])}
            </Grid>
            <Grid item>
                {JournalMenuButton("Submit",[], [])}
            </Grid>
            <Grid item>
                {JournalMenuButton("Help",[], ["/help"])}
            </Grid>
            <Grid item>
              <Search align="right" searchIndex={data.siteSearchIndex.index} />
            </Grid>
          </Grid>
        </Grid>
      )}
    />
  );
}

export default Header
