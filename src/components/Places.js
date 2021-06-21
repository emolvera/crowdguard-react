// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react';
import awsmobile from '../aws-exports';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var ddb = null; // DynamoDB service object

// Set SDK credentials with Cognito Identity Pool
export function InitSDK (credentials){
  AWS.config.credentials = credentials;
  AWS.config.update({region: awsmobile.aws_project_region});
  // Init DynamoDB service object
  ddb = new AWS.DynamoDB.DocumentClient();
};

// Search place index
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
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Search for Places"
          aria-label="Place"
          aria-describedby="basic-addon2"
          value={ place }
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div className="input-group-append">
          <button
            onClick={ handleClick }
            className="btn btn-primary"
            type="submit">Search
          </button>
        </div>
      </div>
    </div>
  )
};

// Update DynamoDB table with user location
export function UpdateUserPositionDDB (props){ 

  var params = {
    TableName: 'crowdguard-user-position',
    Key:{ 'userId': props.username },
    UpdateExpression: 'SET unixTimestamp=:unixTimestamp, userCoordinates=:userCoordinates, placeLabel=:placeLabel',
    ExpressionAttributeValues:{
      ':unixTimestamp':props.timestamp,
      ':userCoordinates':props.userCoordinates,
      ':placeLabel':props.placeLabel
    }
  };

  ddb.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
};