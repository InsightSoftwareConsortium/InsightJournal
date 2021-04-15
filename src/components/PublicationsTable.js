import * as React from "react";
import { makeStyles } from '@material-ui/core/styles';
import { GatsbyImage } from "gatsby-plugin-image"
import { DataGrid } from '@material-ui/data-grid';
import Link from '../components/Link';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  publicationTable: {
    height: 940,
  },
});

const columns = [
  {
    field: 'thumbnail',
    headerName: ' ',
    disableColumnMenu: true,
    width: 80,
    renderCell: (params) => {
      if (params.value) {
        return (<div><GatsbyImage image={params.value} alt="Publication thumbnail" /></div>)
      }
      return (<div/>)
    },
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 300,
    renderCell: (params) => {
      const pubPath= `/browse/publication/${params.id}`
      return (
        <Link to={pubPath}>
      <Typography variant="body1" style={{ whiteSpace: 'normal', wordWrap: "break-word" }} >{params.value}</Typography>
      </Link>
    )
    }
  },
  { field: 'authors',
    headerName: 'Authors',
    width: 240,
    renderCell: (params) => (
      <div>
      <Typography variant="body2" style={{ whiteSpace: 'normal', wordWrap: "break-word" }} >{params.value}</Typography>
      </div>
    )
  },
  {
    field: 'keywords',
    headerName: 'Keywords',
    width: 220,
  },
];

export default function PublicationsTable({ rows }) {
  const classes = useStyles();

  return (
    <>
      <Box className={classes.publicationTable}>
        <DataGrid rowHeight={100} rows={rows} columns={columns} pageSize={8}/>
      </Box>
    </>
  );
};
