import React from 'react';

import happy    from "./img/happy.png";
import neutral  from "./img/neutral.png";
import sad      from "./img/sad.png";

const WindowPopup = props => {
  return (
    <div className='popup-box'>
      <div className='box'>
        <span className='close-icon' onClick={props.handleClose}>x</span>
        <b>You are in {props.userLocation.place}</b>
        <p>
          {props.userLocation.address}
          <br/>
          <img height="40" src={happy} alt='' /*onClick={() => onClick()}*/ />
          <img height="40" src={neutral} alt='' /*onClick={() => onClick()}*/ />
          <img height="40" src={sad} alt='' /*onClick={() => onClick()}*/ />
        </p>
        {props.buttons}
      </div>
    </div>
  );
};

export default WindowPopup;