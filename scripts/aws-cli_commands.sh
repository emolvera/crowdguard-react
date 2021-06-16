#!/bin/bash

./scripts/send-new-locations.sh droptheboxdemo exampledevice us-west-2

aws location get-device-position-history \
    --region us-west-2 \
    --device-id "exampledevice" \
    --start-time-inclusive "2020-10-02T19:05:07.327Z" \
    --end-time-exclusive "2022-10-02T19:20:07.327Z" \
    --tracker-name "droptheboxdemo"

aws location batch-delete-device-position-history \
    --region us-west-2 \
    --device-ids "exampledevice" \
    --tracker-name "droptheboxdemo"

aws location search-place-index-for-text \
    --index-name "crowdguard-placeindex" \
    --text "NYC" \
    --max-results 3 