import {PulseLoader} from "react-spinners";

const Loader = ({loading, small}: {loading: boolean, small?: boolean}) => {
  return (<div className={small ? "" : "text-center w-full my-20"}>
    <PulseLoader
      color="#fff"
      loading={loading}
      size={small ? 5 : 15}
      margin={small ? 10 : 20}
    />
  </div>)
}

export default Loader
