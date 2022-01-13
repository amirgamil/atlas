import Link from 'next/link'

const Splash = () => {
  return (
    <div className="text-white w-1/2 mx-auto my-40">
      <h1 className="text-6xl w-1/2">
        <span className="text-gradient">Atlas</span> your map of web3.
      </h1>
      <h3 className="text-2xl my-10 font-normal">Get personalized recommendations on the newest NFTs, smart contracts, and DAOs. Sign in to get started.</h3>
      <Link href="/explore">
        <a className="button">See what's hot →</a>
      </Link>
    </div>
  )
}

export default Splash