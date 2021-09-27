# Amazon CrowdGuard

## Notes

When you download this files it containes the completed project. You just need it initalize your own Amplify project and create the Amazon Location services in your account.

## Steps for creating this demo

If you want to create this demo from scratch these are the steps you need to follow.

### Initializing the demo

1. Create the react app

```
npx create-react-app crowdguard-react
```

2. Make sure that you have Amplify configured in your computer. If not follow the instructions in the documentation.

https://docs.amplify.aws/start/getting-started/installation/q/integration/react

3. Install bootstrap in your project

```
npm install bootstrap
npm install @aws-amplify/ui-react
```

4. Initialize the react app.

```
amplify init
```

5. Add authentication and push the changes to the cloud

```
amplify add auth
amplify push
```

6. Change the main app page to one using authentication

```
cp base/App-01.js src/App.js
```

7. Start the application, create an account and see that everything is working

```
npm start
```

### Adding maps

1. Now you need to go into your AWS account and create a new map in the Amazon Location service.

2. Install the dependencies

```
npm install aws-sdk
npm install @aws-amplify/core
```

For the map drawing libraries we need to install an older version

```
npm install mapbox-gl@1.0.0
npm install react-map-gl@5.2.11
```

3. Give permissions to your Amplify application to access maps

```
amplify console auth
```

And select Identity Pool, check the name of the auth role and add this inline policy to the role. Replace the information with your account information.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "geo:GetMap*",
            "Resource": "arn:aws:geo:<REGION>:<ACCOUNTNUMBER>:map/<NAMEOFMAP>"
        }
    ]
}
```

### Adding search capabilities

1. Create in the Amazon Location Service a place index.

2. Modify the auth role for the amplify application by adding this permission.

```
{
    "Sid": "VisualEditor1",
    "Effect": "Allow",
    "Action": "geo:SearchPlaceIndexForText",
    "Resource": "arn:aws:geo:<REGION>:<ACCOUNTNUMBER>:place-index/<INDEXNAME>"
}
```

## Resources

This project was based on [this demo](https://github.com/mavi888/drop-the-box-demo) by [mavi888](https://github.com/mavi888/), and on [this AWS sample](https://github.com/aws-samples/amazon-location-samples/tree/main/maplibre-js-react-iot-asset-tracking).