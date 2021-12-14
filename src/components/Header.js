import * as React from 'react';
import { StaticQuery, graphql } from 'gatsby'
import Grid from '@mui/material/Grid';
import Title from './Title';
import Logo from './Logo';
import Search from './Search';
import JournalMenuButton from './JournalMenuButton'
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    paddingBottom: 30,
  },
}));

const Header = () => {
  const classes = useStyles();
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
        <div className={classes.root}>
        <Grid container spacing={0} alignItems="flex-start" justify="center">
          <Grid item xs={3}>
              <Logo targetJournal={ data.site.siteMetadata.targetJournal }/>
          </Grid>
          <Grid item xs={3}>
              <Title siteTitle={ data.site.siteMetadata.title }/>
          </Grid>
	  <Grid item xs={1}>
	      {JournalMenuButton("Home",[], ["/"])}
	  </Grid>
	  <Grid item xs={1}>
	      {JournalMenuButton("About",[], ["/about"])}
	  </Grid>
	  <Grid item xs={1}>
	      {JournalMenuButton("Submit",[], [])}
	  </Grid>
	  <Grid item xs={3}>
	    <Search align="right" searchIndex={data.siteSearchIndex.index} />
          </Grid>
        </Grid>
        </div>
      )}
    />
  );
}

export default Header
