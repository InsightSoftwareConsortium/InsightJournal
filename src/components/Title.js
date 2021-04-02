import * as React from "react";
import Typography from "@material-ui/core/Typography";
import PropTypes from 'prop-types'

export default function Title({ siteTitle }) {
  return (
    <>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {siteTitle}
      </Typography>
    </>
  );
}

Title.propTypes = {
  siteTitle: PropTypes.node.isRequired,
}
