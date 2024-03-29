import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Link from '../components/Link';

export default function JournalMenuButton(text, items, href) {

  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };
  const handleClose = () => {
    setOpen(null);
  };
  let listItems = [];
  let menuObj = "";
  let buttonHref = "";
  let disabled = false;
  if (items.length > 0) {
      listItems = items.map((link, indx) =>
        <MenuItem onClick={handleClose}><Link to={href[indx]}>{link}</Link></MenuItem>
      );
      menuObj =
        <Menu
          anchorEl={anchorEl}
          onClose={handleClose}
          open={Boolean(open)}>
          {listItems}
        </Menu>;
  } else if (href.length === 0) {
    // No items and no hrefs disables the button
    disabled = true;

  } else {
    buttonHref = href[0];
  }
  let buttonText = text;
  return (
    <>
      <Button disabled={disabled} aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} href={buttonHref}>
      {buttonText}
      </Button>
      {menuObj}
    </>
  );
};
