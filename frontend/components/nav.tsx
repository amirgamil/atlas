import { useAppContext } from "./context";

const Nav = () => {
  const context = useAppContext();

  return (
    <div className="w-full h-20 flex">
      <div className="text-2xl my-auto ml-16">Metis</div>
      <div
        className="ml-auto my-auto mr-16 cursor-pointer"
        onClick={context.openModal}
      >
        {context.address
          ? `Signed In: ${context.address.slice(0, 8)}...`
          : "Sign In"}
      </div>
    </div>
  );
};

export default Nav;
