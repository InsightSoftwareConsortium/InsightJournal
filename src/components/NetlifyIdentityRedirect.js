import * as React from 'react';

const NetlifyIdentityRedirect = () => {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/submit/index.html";
        });
      }
    });
  }
  return (<div id="netlifyIdentityRedirection"></div>)
}

export default NetlifyIdentityRedirect
