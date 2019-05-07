import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
// import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(6, 0, 3),
  },
  lightBulb: {
    verticalAlign: 'middle',
    marginRight: theme.spacing(1),
  },
}));

export default function PublicationNiceComponent() {
  const classes = useStyles();
  return (
    <Typography className={classes.root} color="textSecondary">
      This is a nice component of a publication made for learning purposes.
      The publication is a template
    </Typography>
  );
}
