import { createContext, FunctionComponent, useContext, useEffect, useState } from "react";

import { Api } from "../api/api";
import { SpaConfiguration } from "../api/app";

const SpaConfigurationToken = createContext<SpaConfiguration | null>(null);

export const AppSpaConfigurationProvider: FunctionComponent = (props) => {
  const [config, setConfig] = useState<SpaConfiguration | null>(null);

  useEffect(() => {
    (async () => {
      const newConfig = await Api.app.getSpaConfiguration();
      setConfig(newConfig);
    })();
  }, [setConfig]);

  return (
    <>
      <SpaConfigurationToken.Provider value={config}>
        {props.children}
      </SpaConfigurationToken.Provider>
    </>
  );
}

export function useSpaConfiguration(): SpaConfiguration | null {
  const config = useContext(SpaConfigurationToken);
  return config;
}
