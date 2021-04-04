import React from "react";
import { graphql } from "gatsby";
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import theme from '../theme';
import Link from '../components/Link';
import Layout from '../components/Layout';
import MuiLink from '@material-ui/core/Link';

const useStyles = makeStyles({
});

const Render = ({ data }) => {
  const issue = data.json.issue;

  return (
    <>
      <ThemeProvider theme={theme}>
        <Layout>
          <Typography variant="h5" component="h1" gutterBottom>
            {issue.name}
          </Typography>
          <Typography variant="overline" paragraph={true}>
            Issue
          </Typography>
          <Typography variant="subtitle1" paragraph={true}>
            {issue.short_description}
          </Typography>
          <Typography variant="subtitle2" paragraph={true}>
            {issue.introductory_text}
          </Typography>
        </Layout>
      </ThemeProvider>
    </>
  );
};

export default Render;

export const query = graphql`
  query IssueQuery($slug: String!) {
    json(fields: { slug: { eq: $slug } }) {
      issue {
        issue_id
        name
        publications
        short_description
        introductory_text
      }
    }
  }
`;
