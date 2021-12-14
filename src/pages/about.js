import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Layout from '../components/Layout';
import Tab from '@mui/material/Tab';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import Manifesto from '../components/Manifesto.js';
import JournalTechnology from '../components/JournalTechnology.js';

export default function About() {
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
            <TabPanel value="1"><Manifesto /></TabPanel>
            <TabPanel value="2"><JournalTechnology /></TabPanel>
          </TabContext>
        </Box>
      </Container>
    </Layout>
  );
}
