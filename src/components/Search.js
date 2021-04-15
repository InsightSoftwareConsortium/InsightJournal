import React, { Component } from "react"
import { Index } from "elasticlunr"
import { Link } from "gatsby"
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

export default class Search extends Component {
    handleSearch = event => {
      event.preventDefault();
      this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
      this.setState({ anchorEl: null });
    };
    updateQuery = (evt) => {
      this.setState({ query: evt.target.value});
    }
  constructor(props) {
    super(props)
    this.state = {
      query: ``,
      results: [],
    }
  }

  render() {

    const { anchorEl } = this.state
    return (
      <div>
        <form onSubmit={this.search}>
          <TextField id="outlined-basic" label="Search..." variant="outlined" onChange={this.updateQuery}/>
          <Button aria-controls="simple-menu" aria-haspopup="true" onClick={this.search}>
            SEARCH
          </Button>
        </form>
        <Menu
        anchorEl={anchorEl}
        onClose={this.handleClose}
        open={Boolean(anchorEl)}>
          {this.state.results.map(page => (
            <MenuItem key={page.id}>
              <Link to={"/browse/publication/" + page.publication_id}>{page.title}</Link>
            </MenuItem>
          ))}
        </Menu>
      </div>
    )
  }
  getOrCreateIndex = () =>
    this.index
      ? this.index
      : // Create an elastic lunr index and hydrate with graphql query results
        Index.load(this.props.searchIndex)

  search = evt => {
    this.handleSearch(evt);
    const query = this.state.query;
    this.index = this.getOrCreateIndex();
    this.setState({
      query,
      // Query the index with search string to get an [] of IDs
      results: this.index
        .search(query, {expand: true})
        // Map over each ID and return the full document
        .map(({ ref }) => this.index.documentStore.getDoc(ref)),
    })
  }
}
