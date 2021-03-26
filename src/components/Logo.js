import * as React from "react";
import Paper from "@material-ui/core/Paper";
import logoInsightJournal from "../assets/logoInsightJournal.png";
import logoMIDASJournal from "../assets/logoMIDASJournal.png";
import logoVTKJournal from "../assets/logoVTKJournal.png";

export default function Logo({ targetJournal }) {
  let logo;
  let logoAlt;
  switch (targetJournal) {
    case 3:
      logo = logoInsightJournal;
      logoAlt = "The Insight Journal logo";
      break;
    case 31:
      logo = logoMIDASJournal;
      logoAlt = "The MIDAS Journal logo";
      break;
    case 35:
      logo = logoVTKJournal;
      logoAlt = "The VTK Journal logo";
      break;
    default:
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
