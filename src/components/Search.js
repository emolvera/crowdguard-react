import React, { useState } from 'react';
import ReactSearchBox from 'react-search-box';

export function Search(props) {
  const [placeSearch, setPlaceSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleChange = (event) => {
    setPlaceSearch(event.target.value);
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleClick(event);
    }
  }

  const handleClick = (event) => {
    event.preventDefault();
    props.searchPlace(placeSearch);
  }

  const closestPlaces = (placeSearch) => {
    const params = {
      IndexName: props.indexName,
      Text: placeSearch,
      BiasPosition: [props.viewport.longitude, props.viewport.latitude],
    };
    props.client.searchPlaceIndexForText(params, (err, data) => {
      if (err) console.error(err);
      if (data) {
        setSearchResults(data.Results);
      }
    });

  }

  //const value = searchResults.Place.Label;

  return (
    <div className="container">
      <div className="input-group">
        {<input
          type="text"
          className="form-control form-control-lg"
          placeholder="Type a place to search"
          aria-label="Place"
          aria-describedby="basic-addon2"
          value={placeSearch}
          onChange={handleChange}
          onKeyDown={handleKeyDown} />
        }
        <div className="auto-complete-box">
          <ReactSearchBox
            placeholder="Search for John, Jane or Mary"
            data={closestPlaces}
            onSelect={record => console.log(record)}
            onFocus={() => {
              console.log('This function is called when is focussed')
            }}
            onChange={handleChange}
            fuseConfigs={{
              threshold: 0.05,
            }}
            value={placeSearch}
          />
        </div>
        <div className="input-group-append">
          <button
            onClick={handleClick}
            className="btn-search"
            type="submit">Search</button>
        </div>
      </div>
    </div>
  )
};
