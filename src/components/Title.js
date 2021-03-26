import * as React from "react";
import Typography from "@material-ui/core/Typography";

export default function Title({ targetJournal }) {
  let title = "";
  switch (targetJournal) {
    case 3:
      title = "The Insight Journal"
      break;
    case 31:
      title = "The MIDAS Journal"
      break;
    case 35:
      title = "The VTK Journal"
      break;
    default:
      const errorMessage = `Unknown journal: ${targetJournal}`;
      throw errorMessage;
  }
  return (
    <>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {title}
      </Typography>
    </>
  );
}
