import * as React from "react";
import Typography from "@material-ui/core/Typography";

export default function Title({ title }) {
  return (
    <>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {title}
      </Typography>
    </>
  );
}
