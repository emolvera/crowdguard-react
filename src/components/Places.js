// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react';

import awsmobile from '../aws-exports';
import {
  showErrorAlert,
  showSuccessAlert
} from './WindowPopup';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var ddb = null; // DynamoDB service object

// DynamoDB Table Names
const USER_TABLE_NAME = 'crowdguard-user-position';
const PLACE_TABLE_NAME = 'crowdguard-place-status';

// Set SDK credentials with Cognito Identity Pool
export function InitSDK(credentials) {
  AWS.config.credentials = credentials;
  AWS.config.update({ region: awsmobile.aws_project_region });
  // Init DynamoDB service object
  ddb = new AWS.DynamoDB.DocumentClient();
};

// Search place index
export function Search(props) {

  const [place, setPlace] = useState('');

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
          value={place}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div className="input-group-append">
          <button
            onClick={handleClick}
            className="btn btn-primary"
            type="submit">Search
          </button>
        </div>
      </div>
    </div>
  )
};

// Update DynamoDB table with user location
export function UpdateUserPositionDDB(props) {

  var params = {
    TableName: USER_TABLE_NAME,
    Key: { 'userId': props.username },
    UpdateExpression: `SET
        unixTimestamp=:unixTimestamp,
        userCoordinates=:userCoordinates,
        placeLabel=:placeLabel,
        timestampTTL=:timestampTTL`,
    ExpressionAttributeValues: {
      ':unixTimestamp': props.timestamp,
      ':userCoordinates': props.userCoordinates,
      ':placeLabel': props.placeLabel,
      // Expire within 1 hr
      ':timestampTTL': parseInt(props.timestamp/1000) + 3600
    }
  };

  ddb.update(params, function (err, data) {
    if (err) console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    // else console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
  });
};

// Submit user feedback to DDB table
export function submitUserFeedback(username, value) {

  var params = {
    TableName: USER_TABLE_NAME,
    Key: { 'userId': username },
    UpdateExpression: `SET
        userFeedback=:userFeedback`,
    ExpressionAttributeValues: {
      ':userFeedback': value,
    }
  };

  ddb.update(params, function (err, data) {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      showErrorAlert();
    } else {
      //console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
      showSuccessAlert();
    }
  });
}

// Query crowdguard-place-status-mock table
export const GetPlaceStatus = async (placeLabel) => {

  var params = {
    TableName: PLACE_TABLE_NAME,
    KeyConditionExpression: 'placeLabel = :placeLabel AND unixTimestamp >= :unixTimestamp',
    ExpressionAttributeValues: {
        ":placeLabel": placeLabel,
        ':unixTimestamp': Date.now() - 604800000  // 1 week old data only
    }
    // sort key 'unixTimestamp' is optional
  };

  var value = await ddb.query(params).promise()
  return value.Items;
}