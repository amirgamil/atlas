import { useAppContext } from "./context";
import Image from 'next/image'

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
      <div className="ml-auto mr-16">
        <button
          className="ml-auto my-auto cursor-pointer"
          onClick={context.openModal}
        >
          {context.address
            ? `Signed In: ${context.address.slice(0, 8)}...`
            : "Sign In"}
        </button>
        {context.address && 
          <button
            className="my-auto ml-4 cursor-pointer button-dark"
            onClick={context.signOut}
          >
            Sign Out
          </button>
        }
      </div>
    </div>
  );
};

export default Nav;
