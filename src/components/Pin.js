// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import React, { PureComponent } from 'react';
import '../css/Pin.css';

import pinGray    from '../img/pin-gray.png';
import pinRed     from '../img/pin-red.png';
import pinYellow  from '../img/pin-yellow.png';
import pinGreen   from '../img/pin-green.png';

import redLight     from '../img/redLight.png';
import yellowLight  from '../img/yellowLight.png';
import greenLight   from '../img/greenLight.png';

const pinStyle = {
  cursor: 'pointer',
  fill: '#d00',
  stroke: 'none',
};

const placeStatusText = {
  1: 'Empty',
  2: 'Moderate',
  3: 'Full'
};

export default class Pin extends PureComponent {

  render() {
    const { placeData, size = 30, onClick } = this.props;
    const coordinates = placeData.Place.Geometry.Point;
    const label = placeData.Place.Label;
    const userData = placeData.userData;
    var data = {};

    // if UserData exists
    if (userData.length > 0) {
      data = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        place: label.split(', ')[0],
        address: label.split(', ').slice(1).join(', '),
        unixTimestamp: userData[0].unixTimestamp,
        userCount: userData[0].userCount,
        avgUserFeedback: Math.round(userData[0].avgUserFeedback)
      };
    } // if UserData does not exist
    else {
      data = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        place: label.split(', ')[0],
        address: label.split(', ').slice(1).join(', '),
        unixTimestamp: null,
        userCount: null,
        avgUserFeedback: null
      };
    };
    //console.log(data);

    // Set colors
    var pinImage = null;
    // Set pin to grey if data is not recent
    if (!isDataRecent(data.unixTimestamp)){
      pinImage = pinGray;
    }
    else{ // Data is recent
      switch(data.avgUserFeedback) {
        case 1:
          pinImage = pinGreen;
          break;
        case 2:
          pinImage = pinYellow;
          break;
        case 3:
          pinImage = pinRed;
          break;
        default:
          pinImage = pinGray;
      };
    };  
    return (
      <img
        alt=''
        height={size}
        viewBox='0 0 24 24'
        style={{
          ...pinStyle,
          transform: `translate(${-size / 2}px,${-size}px)`,
        }}
        onClick={() => onClick(data)}
        src={pinImage}
        className={''}
      />
    );
  }
}

export function trafficLight(userFeedback){
  
  const size = 30;
  var lightImage = null;
  var textColor = '';
  switch (userFeedback) {
    case 1:
      lightImage = greenLight;
      textColor = '#75c74c';
      break;
    case 2:
      lightImage = yellowLight;
      textColor = '#eebb3e';
      break;
    case 3:
      lightImage = redLight;
      textColor = '#df5f57';
      break;
    default:
      lightImage = null;
      textColor = 'black';
  };

  const feedbackTextStyle = {
    color: textColor
  };

  return (
    <div>
      Status: <b style={feedbackTextStyle}>{placeStatusText[userFeedback]} </b>
      <img
        alt=''
        height={size}
        src={lightImage}
      />
    </div>
  );
};

const maxTimeDelta = 7200000; // 2 hrs TTL in ms
export function isDataRecent(unixTimestamp) {
  return ( new Date() - unixTimestamp ) < maxTimeDelta;
};


const dataRecencyStyle = {
    color: 'gray',
    fontSize: '14px'
};
export function dataRecency(unixTimestamp) {
  var today = new Date().getMinutes();
  const dataDate = new Date(unixTimestamp).getMinutes();
  if (dataDate > today) { // Catch negative difference
    today += 60;
  };
  const minAgo = today - dataDate;

  var returnData = null;
  switch (minAgo) {
    case 0:
      returnData = <i style={dataRecencyStyle}>Updated a few seconds ago</i>;
      break;
    case 1:
      returnData = <i style={dataRecencyStyle}>Updated a minute ago</i>;
      break;
    default:
      returnData = <i style={dataRecencyStyle}>Updated {minAgo} minutes ago</i>;
  }
  return returnData;
};

export function setPlacePriority(userData) {
  if (userData.length===0) return 4
  else {
    if (!isDataRecent(userData[0].unixTimestamp)) return 4
    else return userData[0].avgUserFeedback;
  };
};