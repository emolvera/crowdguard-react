// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import React, { PureComponent } from "react";
import pin from "./img/pin.png";
import "./Pin.css";

const pinStyle = {
  cursor: "pointer",
  fill: "#d00",
  stroke: "none",
};


export default class CityPin extends PureComponent {
  render() {
    const { size = 30, onClick } = this.props;

    return (
      <img
        alt=''
        height={size}
        viewBox="0 0 24 24"
        style={{
          ...pinStyle,
          transform: `translate(${-size / 2}px,${-size}px)`,
        }}
        onClick={() => onClick()}
        src={pin}
        //className={"blink-img"}
        className={""}
      />
    );
  }
}
