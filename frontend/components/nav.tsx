import { useAppContext } from "./context";
import Image from 'next/image'
import Link from 'next/link'

const Nav = () => {
  const context = useAppContext();

  return (
    <div className="w-full pt-8 h-26 flex text-white">
      <div className="text-2xl my-auto ml-16 flex">
        <Image
          src="/logo.png"
          alt="Logo"
          width={50}
          height={50}
        />
        <h1 className="my-auto ml-4 text-3xl text-gradient glow">Atlas</h1>
      </div>
      <div className="ml-auto my-auto mr-16">
        {context.address && <>
          <Link href={`/graph?center=${context.address}`}>
            <a className="button secondary mr-4">
              Local Graph
            </a>
          </Link>
          <Link href={`/explore`}>
            <a className="button secondary mr-4">
              Explore
            </a>
          </Link>
          <button
            className="my-auto cursor-pointer secondary mr-4"
            onClick={context.signOut}
          >
            Sign Out
          </button>
        </>}
        <button
          className="cursor-pointer"
          onClick={context.openModal}
        >
          {context.address
            ? `My Wallet: ${context.address.slice(0, 6).toLowerCase()}..`
            : "Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Nav;
