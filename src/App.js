import './css/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import awsmobile from './aws-exports';
import Amplify, { Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import { Signer } from '@aws-amplify/core';
import Location from 'aws-sdk/clients/location';

import {
  InitSDK,
  Search,
  UpdateUserPositionDDB,
  GetPlaceStatus
} from './components/Places';
import {
  showFeedbackAlert
} from './components/WindowPopup';
import Pin from './components/Pin';
import { trafficLight } from './components/Pin';

import ReactMapGL, {
  Popup,
  Marker,
  NavigationControl,
  GeolocateControl
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapName = 'crowdguard-map'; // HERE IT GOES THE NAME OF YOUR MAP
const indexName = 'crowdguard-placeindex'; // HERE GOES THE NAME OF YOUR PLACE INDEX
//const trackerName = 'crowdguard-tracker' // HERE GOES THE NAME OF  YOUR TRACKER
//const deviceID = 'exampledevice' // HERE IT GOES THE NAME OF YOUR DEVICE

const maxPlaces = 15;     // Max number search results to display on the map
var placeLabel = '';
var user = null;

Amplify.configure(awsmobile);

/**
* Sign requests made by Mapbox GL using AWS SigV4.
*/
const transformRequest = (credentials) => (url, resourceType) => {
  // Resolve to an AWS URL
  if (resourceType === 'Style' && !url?.includes('://')) {
    url = `https://maps.geo.${awsmobile.aws_project_region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
  }

  // Only sign AWS requests (with the signature as part of the query string)
  if (url?.includes('amazonaws.com')) {
    return {
      url: Signer.signUrl(url, {
        access_key: credentials.accessKeyId,
        secret_key: credentials.secretAccessKey,
        session_token: credentials.sessionToken,
      })
    };
  }

  // Don't sign
  return { url: url || '' };
};

function App() {

  const [credentials, setCredentials] = useState(null);
  const [client, setLocationClient] = useState(null);

  //Check if there are credentials set, if not, get credentials
  async function getUserCredentials() {
    let currCredentials;
    try {
      currCredentials = await Auth.currentCredentials();
      if ('sessionToken' in currCredentials) {
        // Retrieve User Data
        const session = await Auth.currentSession();
        user = session.idToken.payload;
        user.username = user['cognito:username'];
        return setCredentials(currCredentials);
      } else throw new Error('Not Authenticated');
    } catch (err) {
      alert(err);
      return null;
    }
  }
  // Create and Amazon Location Client using AWS SDK and Render the Map;
  function initLocationClient() {
    try {
      const newLocationClient = new Location({
        credentials: credentials,
        region: awsmobile.aws_project_region,
      });
      return setLocationClient(newLocationClient);
    } catch (error) {
      alert(error);
    }
  }
  useEffect(() => {
    const getCredentials = async () => await getUserCredentials();
    getCredentials();
  }, []);
  useEffect(() => {
    if (credentials && !client) {
      initLocationClient(credentials);
      InitSDK(credentials);
    }
  }, [credentials]);
  useEffect(() => {
    if (client && credentials) { }
  }, [client]);

  const [viewport, setViewport] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1,
  });

  const [userLocation, setUserLocation] = useState({
    longitude: 0,
    latitude: 0,
    place: '',
    address: ''
  });

  const navControlStyle = {
    position: 'absolute',
    top: 36,
    left: 0,
    padding: '10px'
  };

  const geolocateControlStyle = {
    position: 'absolute',
    left: 0,
    margin: 0,
    padding: '10px',
  };

  // Create React Map Gl Place Markers & Popups
  const [markers, setMarkers] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);

  const searchPlace = async (place) => {

    const params = {
      IndexName: indexName,
      Text: place,
      BiasPosition: [viewport.longitude, viewport.latitude],
      MaxResults: maxPlaces
      /*FilterBBox: [ viewport.longitude-coordRange, viewport.latitude-coordRange, viewport.longitude+coordRange, viewport.latitude+coordRange]*/
    };

    client.searchPlaceIndexForText(params, async (err, data) => {
      if (err) console.error(err);

      if (data) {
        
        const n = Math.min(maxPlaces, data.Results.length);
        var placeData = data.Results.slice(0, n)

        // Append Status to data result
        for (let i=0; i<n; i++){
          var thisLabel = placeData[i].Place.Label;
          var userData = await GetPlaceStatus(thisLabel);
          // Sort in descending order accorting to unixTimestamp
          var sortedUserData = userData.sort(
            (a, b) => b.unixTimestamp - a.unixTimestamp
          );
          placeData[i]['userData'] = sortedUserData;
        };
        
        const coordinates = placeData[0].Place.Geometry.Point;
        const label = placeData[0].Place.Label;

        setMarkers(placeData);

        setViewport({
          longitude: coordinates[0],
          latitude: coordinates[1],
          zoom: 14
        });
        // if UserData exists
        if (placeData[0].userData.length > 0) {
          var thisUserData = placeData[0].userData[0];
          setPopupInfo({  // Show Popoup for closest Pin
            key: 'marker0',
            longitude: coordinates[0],
            latitude: coordinates[1],
            place: label.split(', ')[0],
            address: label.split(', ').slice(1).join(', '),
            unixTimestamp: thisUserData.unixTimestamp,
            userCount: thisUserData.userCount,
            avgUserFeedback: Math.round(thisUserData.avgUserFeedback)
          });
        } // if UserData does not exist
        else {
          setPopupInfo({  // Show Popoup for closest Pin
            key: 'marker0',
            longitude: coordinates[0],
            latitude: coordinates[1],
            place: label.split(', ')[0],
            address: label.split(', ').slice(1).join(', '),
            unixTimestamp: null,
            userCount: null,
            avgUserFeedback: null
          });
        };
      }
    });
  }

  // Create React Map Gl markers.
  const mapMarkers = React.useMemo(() =>
    markers.map((placeData, index) => (
      <Marker
        key={`marker${index}`}
        longitude={placeData.Place.Geometry.Point[0]}
        latitude={placeData.Place.Geometry.Point[1]}
      >
        <Pin
          key={`pin${index}`}
          placeData={placeData}
          onClick={setPopupInfo}
        />
      </Marker>
    )), [markers]
  );

  const reverseSearchPlace = (userCoordinates, timestamp) => {

    const params = {
      IndexName: indexName,
      MaxResults: 1,
      Position: userCoordinates
    };

    client.searchPlaceIndexForPosition(params, (err, data) => {
      if (err) console.error(err);
      if (data) {
        const newPlaceLabel = data.Results[0].Place.Label;
        const place = newPlaceLabel.split(', ')[0];
        const address = newPlaceLabel.split(', ').slice(1).join(', ');

        setUserLocation({
          longitude: userCoordinates[0],
          latitude: userCoordinates[1],
          place: place,
          address: address
        });

        // User place changed
        if (placeLabel !== newPlaceLabel) {
          // Show feedback popup
          showFeedbackAlert({
            username: user.username,
            place: place,
            address: address
          });
          // Update DB table
          UpdateUserPositionDDB({
            username: user.username,
            timestamp: timestamp,
            userCoordinates: userCoordinates,
            placeLabel: newPlaceLabel
          });
          placeLabel = newPlaceLabel; // Update place label
        }
      }
      return;
    });
  }

  // Get User Geolocation
  const onGeolocate = (geolocation) => {
    if (geolocation != null) {
      const userCoordinates = [geolocation.coords.longitude, geolocation.coords.latitude];
      //console.log(`userCoordinates: ${userCoordinates}\n`);
      reverseSearchPlace(userCoordinates, geolocation.timestamp);
    };
  };

  const addressStyle = {
    color: 'gray',
    fontSize: '12px'
  };

  // RETURN
  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Amazon CrowdGuard</h1>
      </header>
      <div>
        <AmplifyAuthenticator>
          <div className='container'>
            <div className='row'>
              <div className='col'>
                <Search searchPlace={searchPlace} />
              </div>
              <AmplifySignOut />
            </div>
          </div>
          {credentials ? (
            <ReactMapGL
              {...viewport}
              width='100vw'
              height='90vh'
              transformRequest={transformRequest(credentials)}
              mapStyle={mapName}
              onViewportChange={setViewport}
            >
              <div className='nav' style={navControlStyle}>
                <NavigationControl showCompass={false} />
              </div>
              <div className='nav' style={geolocateControlStyle}>
                <GeolocateControl
                  onGeolocate={onGeolocate}
                  positionOptions={{ enableHighAccuracy: true }}
                  trackUserLocation={true}
                  showUserLocation={true}
                  showAccuracyCircle={true}
                  fitBoundsOptions={{maxZoom: 10}}
                  auto
                />
              </div>
              {mapMarkers}
              {popupInfo && (
                <Popup
                  tipSize={15}
                  anchor='top'
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  closeOnClick={false}
                  onClose={setPopupInfo}
                >
                  <span>
                    <h4>
                      {popupInfo.place}
                    </h4>
                    <p style={addressStyle}>
                      {popupInfo.address}
                    </p>
                    {popupInfo.avgUserFeedback ? (
                      <p>
                        <b>{popupInfo.userCount} </b>users checked in
                        <br/>
                        {trafficLight(popupInfo.avgUserFeedback)}
                      </p>
                    ) : (
                      <p>No user data</p>
                    )}
                  </span>
                </Popup>
              )}
            </ReactMapGL>
          ) : (
            <h1>Loading...</h1>
          )}
        </AmplifyAuthenticator>
      </div>
    </div>
  );
}

export default App;
