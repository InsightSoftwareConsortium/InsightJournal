import * as React from "react";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import logoInsightJournal from "../assets/logoInsightJournal.png";

const Logo = ({ targetJournal }) => {
  let logo;
  let logoAlt;
  if (targetJournal === "Insight" || targetJournal === 3) {
    logo = logoInsightJournal;
    logoAlt = "logoInsightJournal";
  } else {
    const errorMessage = `Unknown journal: ${targetJournal}`;
    throw errorMessage;
  }

  return (
    <>
      <Paper elevation={0} align="center">
        <img src={logo} alt={logoAlt} />
      </Paper>
    </>
  );
};

const Title = ({ targetJournal }) => {
  let title = "";
  if (targetJournal === "Insight" || targetJournal === 3) {
    title = "Insight Journal";
  } else {
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

export {Logo, Title};
