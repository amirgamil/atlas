import Avatar from "boring-avatars";
import React from "react";
import { Account } from "../types";

export function Recommendation(props: Account) {
  return (
    <div className="glass my-6 py-2 px-4 w-1/2 flex">
      <div className="my-auto mr-4">
        <Avatar
          size={30}
          variant="marble"
          colors={["#3f5d88", "#0087b6", "#00b1b5", "#00d47f", "#a8eb12"]}
        />
      </div>
      <div>
        <h3 className="text-lg">
          <span className="opacity-50 text-base font-normal"></span>
        </h3>
        <a
          className="opacity-50 text-sm"
          href={`https://etherscan.io/address/${props.addr}`}
        >
          {props.name ? props.name : props.addr}
        </a>
      </div>
    </div>
  );
}
