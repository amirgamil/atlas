const SafeHydrate = ({ children }: { children: any }) => {
  return (
    <div suppressHydrationWarning>
      {typeof window === "undefined" ? null : children}
    </div>
  );
};

export default SafeHydrate;
