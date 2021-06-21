import React from 'react';

import happy    from '../img/happy.png';
import neutral  from '../img/neutral.png';
import sad      from '../img/sad.png';

import { submitUserFeedback} from './Places';
import { toggleWindowPopup } from '../App';

export const WindowPopup = props => {
  return (
    <div className='popup-box'>
      <div className='box'>
        <span className='close-icon' onClick={toggleWindowPopup}>x</span>
        <b>You are in {props.userLocation.place}</b>
        <p>
          {props.userLocation.address}
        </p>
        <br/>
        <p>
          <img height="40" src={happy} alt='' onClick={() => submitUserFeedback(props.user.username, 1)} />
          The place is empty
        </p>
        <p>
          <img height="40" src={neutral} alt='' onClick={() => submitUserFeedback(props.user.username, 2)} />
          The place is normal
        </p>
        <p>
          <img height="40" src={sad} alt='' onClick={() => submitUserFeedback(props.user.username, 3)} />
          The place is full
        </p>
        <button 
          onClick={ toggleWindowPopup } 
          className='btn btn-secondary' 
          type='submit'
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default WindowPopup;