import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import awsmobile from "./aws-exports";
import Amplify, { Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import { Signer } from "@aws-amplify/core";
import Location from "aws-sdk/clients/location";

import { Search } from './components/Search';
import WindowPopup from './components/WindowPopup';
import Pin from './components/Pin';

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

const maxPlaces = 15;     // Max number search results to display on the map
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

function App() {

  const [credentials, setCredentials] = useState(null);
  const [client, setLocationClient] = useState(null);

  //Check if there are credentials set, if not, get credentials
  async function getUserCredentials() {
    let currCredentials;
    try {
      currCredentials = await Auth.currentCredentials();
      if ("sessionToken" in currCredentials) {
        return setCredentials(currCredentials);
      } else throw new Error("Not Authenticated");
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

  const [searchResults, setSearchResults] = useState(null);
  const searchPlace = (placeSearch) => {
    const params = {
      IndexName: indexName,
      Text: placeSearch,
      BiasPosition: [viewport.longitude, viewport.latitude],
      /*FilterBBox: [ viewport.longitude-coordRange, viewport.latitude-coordRange, viewport.longitude+coordRange, viewport.latitude+coordRange]*/
    };
    client.searchPlaceIndexForText(params, (err, data) => {
      if (err) console.error(err);
      if (data) {
        setSearchResults(data.Results);
        /////////////////////////////////
        var n = Math.min(maxPlaces, data.Results.length);
        setMarkers(data.Results.slice(0, n));
        const coordinates = data.Results[0].Place.Geometry.Point;
        const label = data.Results[0].Place.Label;

        setViewport({
          longitude: coordinates[0],
          latitude: coordinates[1],
          zoom: 14
        });

        setPopupInfo({  // Show Popoup for closest Pin
          key: 'marker0',
          longitude: coordinates[0],
          latitude: coordinates[1],
          place: label.split(', ')[0],
          address: label.split(', ').slice(1).join(', ')
        });
        /////////////////////////////////
      }
    });
    //console.log(searchResults); BORRAR
  }

  // Create React Map Gl markers.
  const mapMarkers = React.useMemo(() =>
    markers.map((places, index) => (
      <Marker
        key={`marker${index}`}
        longitude={places.Place.Geometry.Point[0]}
        latitude={places.Place.Geometry.Point[1]}
      >
        <Pin
          key={`pin${index}`}
          placeData={places.Place}
          onClick={setPopupInfo}
        />
      </Marker>
    )), [markers]
  );

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
        if (placeLabel !== data.Results[0].Place.Label) {
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
                <Search
                  searchPlace={searchPlace}
                  indexName={indexName}
                  viewport={setViewport}
                  client={setLocationClient}
                />
              </div>
              <AmplifySignOut />
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
                <NavigationControl showCompass={false} />
              </div>
              <div className="nav" style={geolocateControlStyle}>
                <GeolocateControl
                  onGeolocate={onGeolocate}
                  positionOptions={{ enableHighAccuracy: true }}
                  trackUserLocation={true}
                  showUserLocation={true}
                  showAccuracyCircle={true}
                  auto
                />
              </div>
              {mapMarkers}
              {popupInfo && (
                <Popup
                  tipSize={5}
                  anchor="top"
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  closeOnClick={false}
                  onClose={setPopupInfo}
                >
                  <span><b>{popupInfo.place}</b></span>
                  <br />
                  <span>{popupInfo.address}</span>
                </Popup>
              )}
              {isOpen && <WindowPopup
                buttons={<>
                  <button
                    onClick={toggleWindowPopup}
                    className="btn btn-secondary"
                    type="submit">Close</button>
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
