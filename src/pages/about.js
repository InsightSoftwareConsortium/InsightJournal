import * as React from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Layout from '../components/Layout';
import Tab from '@material-ui/core/Tab';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import Manifesto from '../components/Manifesto.js';
import JournalTechnology from '../components/JournalTechnology.js';
import { graphql } from 'gatsby'

export default function About({ data }) {
  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <TabContext value={value}>
            <TabList indicatorColor="primary" textColor="primary" aria-label="about component" onChange={handleChange}>
              <Tab label="Manifesto" value="1" />
              <Tab label="Technology" value="2" />
            </TabList>
            <TabPanel value="1"><Manifesto galileo={data.galileo}/></TabPanel>
            <TabPanel value="2"><JournalTechnology cartoon={data.cartoon} /></TabPanel>
          </TabContext>
        </Box>
      </Container>
    </Layout>
  );
}

export const query = graphql`
  query {
    cartoon: file(relativePath: { eq: "Merkle.png"}) {
      childImageSharp {
        gatsbyImageData(layout: FIXED, width: 400, height: 367)
      }
    }
    galileo: file(relativePath: { eq: "GalileoPortraitBySustermans.jpg"}) {
      childImageSharp {
        gatsbyImageData(layout: FIXED, width: 358, height: 395)
      }
    }
  }
`

    // galileofile(relativePath: { eq: "GalileoPortraitBySustermans.jpg"}) {
    //   childImageSharp {
    //     gatsbyImageData(layout: FIXED, width: 358, height: 395)
    //     }
    //   }
    // }