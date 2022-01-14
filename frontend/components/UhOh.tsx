import React from "react";

const UhOh = ({children}: {children?: React.ReactNode}) => {
  return (
    <div className="text-white w-1/2 mx-auto my-40">
      <h1 className="text-3xl w-1/2">
        Uh oh.
      </h1>
      <p>{children}</p>
    </div>
  )
}

export default UhOh
