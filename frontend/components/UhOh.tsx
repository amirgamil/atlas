import React from "react";

const UhOh = ({children}: {children?: React.ReactNode}) => {
  return (
    <div className="text-white w-1/2 mx-auto my-40">
      <h1 className="text-6xl w-1/2">
        Uh oh.
      </h1>
      <h3 className="text-2xl my-10 font-normal">Something went wrong!</h3>
      <p>${children}</p>
    </div>
  )
}

export default UhOh
