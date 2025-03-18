import { createContext, useState } from "react";

const userContext = createContext();

const UserProvider = ({ children }) => {
  const [cuser, setCuser] = useState("");

  return (
    <userContext.Provider value={{ cuser, setCuser }}>
      {children}
    </userContext.Provider>
  );
};

export { userContext, UserProvider };
