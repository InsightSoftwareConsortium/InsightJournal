import { navigate } from 'gatsby';


export const onRouteUpdate = ({ location }) => {
  if (location.pathname.startsWith('/rire')) {
    navigate('https://rire.insight-journal.org/');
  }
};
