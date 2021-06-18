// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import React, { PureComponent } from "react";
import pin from "../img/pin.png";
import "../css/Pin.css";

const pinStyle = {
  cursor: "pointer",
  fill: "#d00",
  stroke: "none",
};

export default class Pin extends PureComponent {
  render() {
    const { placeData, size = 30, onClick } = this.props;
    
    const coordinates = placeData.Geometry.Point;
    const label = placeData.Label;
    const data = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        place: label.split(', ')[0],
        address: label.split(', ').slice(1).join(', '),
      };

    return (
      <img
        alt=''
        height={size}
        viewBox="0 0 24 24"
        style={{
          ...pinStyle,
          transform: `translate(${-size / 2}px,${-size}px)`,
        }}
        onClick={() => onClick(data)}
        src={pin}
        className={""}
      />
    );
  }
}
