import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import Amplify, { Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import { Signer } from "@aws-amplify/core";
import Location from "aws-sdk/clients/location";

import { Search } from './Places';
import WindowPopup from './WindowPopup';
import Pin from './Pin';

import ReactMapGL, {
  Popup,
  Marker,
  NavigationControl,
  GeolocateControl
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import awsconfig from './aws-exports';

const mapName = "crowdguard-map"; // HERE IT GOES THE NAME OF YOUR MAP
const indexName = "crowdguard-placeindex"; // HERE GOES THE NAME OF YOUR PLACE INDEX
//const trackerName = "crowdguard-tracker" // HERE GOES THE NAME OF  YOUR TRACKER
//const deviceID = "exampledevice" // HERE IT GOES THE NAME OF YOUR DEVICE
var placeLabel = '';

Amplify.configure(awsconfig);

/**
* Sign requests made by Mapbox GL using AWS SigV4.
*/
const transformRequest = (credentials) => (url, resourceType) => {
  // Resolve to an AWS URL
  if (resourceType === "Style" && !url?.includes("://")) {
    url = `https://maps.geo.${awsconfig.aws_project_region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
  }

  // Only sign AWS requests (with the signature as part of the query string)
  if (url?.includes("amazonaws.com")) {
    return {
      url: Signer.signUrl(url, {
        access_key: credentials.accessKeyId,
        secret_key: credentials.secretAccessKey,
        session_token: credentials.sessionToken,
      })
    };
  }

  // Don't sign
  return { url: url || "" };
};

const App = () => {

  useEffect(() => {
    const fetchCredentials = async () => {
      setCredentials(await Auth.currentUserCredentials());
    };

    fetchCredentials();

    const createClient = async () => {
      const credentials = await Auth.currentCredentials();
      const client = new Location({
          credentials,
          region: awsconfig.aws_project_region,
     });
     setClient(client);
    }

    createClient();  
  }, []);

  const [credentials, setCredentials] = useState(null);

  const [client, setClient] = useState(null);

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
 
  const [marker, setMarker] = useState({
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
  
  const geolocateControlStyle= {
    position: 'absolute',
    left: 0,
    margin: 0,
    padding: '10px',
  };
  
  const searchPlace = (place) => {

    const params = {
      IndexName: indexName,
      Text: place,
      BiasPosition: [userLocation.longitude,userLocation.latitude]
    };

    client.searchPlaceIndexForText(params, (err, data) => {
      if (err) console.error(err);
      if (data) {
 
        const coordinates = data.Results[0].Place.Geometry.Point;
        setViewport({
          longitude: coordinates[0],
          latitude: coordinates[1], 
          zoom: 13});
        setMarker({
          longitude: coordinates[0],
          latitude: coordinates[1],
          place: data.Results[0].Place.Label.split(', ')[0],
          address: data.Results[0].Place.Label.split(', ').slice(1).join(', '),
        })
        toggleMarkerPopup(true);

        return coordinates;
      }
    });
  }
  
  const reverseSearchPlace = (userCoordinates) => {

    const params = {
      IndexName: indexName,
      MaxResults: 1,
      Position: userCoordinates
    };

    client.searchPlaceIndexForPosition(params, (err, data) => {
      if (err) console.error(err);
      if (data) {

        // Show popup if user place changed
        if (placeLabel !== data.Results[0].Place.Label){
          setIsOpen(false);
          toggleWindowPopup();
        }

        placeLabel = data.Results[0].Place.Label;
        
        setUserLocation({
          longitude: userCoordinates[0],
          latitude: userCoordinates[1],
          place: placeLabel.split(', ')[0],
          address: placeLabel.split(', ').slice(1).join(', '),
        });
      }
      return;
    });
  }

  // Create React Map Gl Popups
  const [showMarkerPopup, toggleMarkerPopup] = useState(false);

  // Define WindowPopup
  const [isOpen, setIsOpen] = useState(false);
  const toggleWindowPopup = () => {
    setIsOpen(!isOpen);
  }

  // Get User Geolocation
  const onGeolocate = (geolocation) => {
    if (geolocation != null) {
      const userCoordinates = [geolocation.coords.longitude, geolocation.coords.latitude];
      //console.log(`userCoordinates: ${userCoordinates}\n`);
      reverseSearchPlace(userCoordinates);
    };
  };

  // RETURN
  return (
    <div className="App">
      <header className="App-header">
          <h1>Amazon CrowdGuard</h1>
      </header>
      <div>
      <AmplifyAuthenticator>
      <div className="container">
        <div className="row">
          <div className="col">
            <Search searchPlace = {searchPlace} />
          </div>
          <AmplifySignOut/>
        </div>
      </div>
      {credentials ? (
          <ReactMapGL
            {...viewport}
            width="100vw"
            height="100vh"
            transformRequest={transformRequest(credentials)}
            mapStyle={mapName}
            onViewportChange={setViewport}
          >
            <div className="nav" style={navControlStyle}>
              <NavigationControl showCompass={false}/>
            </div>
            <div className="nav" style={geolocateControlStyle}>
              <GeolocateControl
                onGeolocate={onGeolocate}
                positionOptions={{enableHighAccuracy: true}}
                trackUserLocation={true}
                showUserLocation={true}
                showAccuracyCircle={true}
                auto
              />
            </div>
            <Marker
              longitude={marker.longitude}
              latitude={marker.latitude}
            > 
              <Pin
                onClick={() => toggleMarkerPopup(true)}
              />
            </Marker>
            {showMarkerPopup && (
              <Popup
                longitude={marker.longitude}
                latitude={marker.latitude}
                closeButton={true}
                closeOnClick={false}
                onClose={() => toggleMarkerPopup(false)}
                anchor="top"
              >
                <span><b>{marker.place}</b></span>
                <br/>
                <span>{marker.address}</span>
              </Popup>
            )}
            {isOpen && <WindowPopup
              buttons={<>
                <button onClick={ toggleWindowPopup } className="btn btn-secondary" type="submit">Close</button>
              </>}
              handleClose={toggleWindowPopup}
              userLocation={userLocation}
            />}
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
