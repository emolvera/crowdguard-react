#!/bin/bash

./scripts/send-new-locations.sh crowdguard-tracker exampledevice us-west-2

aws location get-device-position-history \
    --region us-west-2 \
    --device-id "exampledevice" \
    --start-time-inclusive "2020-10-02T19:05:07.327Z" \
    --end-time-exclusive "2022-10-02T19:20:07.327Z" \
    --tracker-name "crowdguard-tracker"

aws location batch-delete-device-position-history \
    --region us-west-2 \
    --device-ids "exampledevice" \
    --tracker-name "crowdguard-tracker"

aws location search-place-index-for-text \
    --index-name "crowdguard-placeindex" \
    --text "starbucks"  \
    --max-results 3 \
    --bias-position [-99.19514999999996,19.647110000000055]
    
aws location search-place-index-for-position \
    --index-name "crowdguard-placeindex" \
    --max-results 1 \
    --position [-99.19514999999996,19.647110000000055]