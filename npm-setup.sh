#!/bin/bash

amplify status
amplify pull --appId d1od2og7jwx8op --envName dev
npm install bootstrap
npm install @aws-amplify/ui-react
npm install aws-sdk
npm install @aws-amplify/core
npm install mapbox-gl@1.0.0
npm install react-map-gl@5.2.11
npm install sweetalert2
npm init
npm start