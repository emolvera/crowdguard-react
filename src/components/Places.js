import React, { useState } from 'react';

export function Search(props){

  const [place, setPlace] = useState('Seattle');
  
  const handleChange = (event) => {
    setPlace(event.target.value);
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleClick(event);
    }   
  }

  const handleClick = (event) => {
    event.preventDefault();
    props.searchPlace(place)
  }
  
  return (
    <div className="container">
      <div className="input-group">
        <input type="text" className="form-control form-control-lg" placeholder="Search for Places" aria-label="Place" aria-describedby="basic-addon2" value={ place } onChange={handleChange} onKeyDown={handleKeyDown}/>
        <div className="input-group-append">
          <button onClick={ handleClick } className="btn btn-primary" type="submit">Search</button>
        </div>
      </div>
    </div>
  )
};
