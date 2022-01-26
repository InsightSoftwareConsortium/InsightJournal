import * as React from "react";
import Paper from "@mui/material/Paper";
import targetJournalLogo from './targetJournalLogo';

export default function Logo({ targetJournal }) {
  const { logo, logoAlt } = targetJournalLogo(targetJournal)

  return (
    <>
      <Paper elevation={0} align="center">
        <img src={logo} alt={logoAlt} />
      </Paper>
    </>
  );
};
