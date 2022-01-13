import {PulseLoader} from "react-spinners";

const Loader = ({loading}: {loading: boolean}) => {
  return (<div className="text-center w-full my-20">
    <PulseLoader
      color="#fff"
      loading={loading}
      size={15}
      margin={20}
    />
  </div>)
}

export default Loader
