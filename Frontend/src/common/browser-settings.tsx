import { useState, FunctionComponent, useEffect, createContext, Dispatch, useContext, useCallback } from "react";

import { AuthenticationMethodType } from "./authentication";
import { isNonEmptyString } from "./helper-functions";

export interface BrowserSettingsContext {
  settings: BrowserSettings | null;
  setSettings: Dispatch<BrowserSettings | null>;
};

export interface BrowserSettings {
  defaultAuthMethod: AuthenticationMethodType | null;
};

const BrowserSettingsToken = createContext<BrowserSettingsContext>({
  settings: null,
  setSettings: () => { throw new Error("BrowserSettingsContext has not yet been initialized."); }
});

function validateBrowserSettings(val: any | null | undefined): val is BrowserSettings {
  if (val == null) {
    return false;
  }
  if (typeof val !== "object") {
    return false;
  }
  if (!("defaultAuthMethod" in val)) {
    return false;
  }
  return true;
}

export const AppBrowserSettingsContextProvider: FunctionComponent = ({ children }) => {
  const [settings, setSettingsInner] = useState<BrowserSettings | null>(null);

  const setSettings: Dispatch<BrowserSettings | null> = useCallback((newSettings) => {
    if (newSettings == null) {
      localStorage.removeItem("browserSettings");
    } else {
      localStorage.setItem("browserSettings", JSON.stringify(newSettings));
    }

    setSettingsInner(newSettings);
  }, [setSettingsInner]);

  const onStorageChange = useCallback(() => {
    const values = localStorage.getItem("browserSettings");
    if (isNonEmptyString(values)) {
      const newSettings = JSON.parse(values);
      if (validateBrowserSettings(newSettings)) {
        setSettings(newSettings);
      } else {
        setSettings(null);  // TODO: Might want to do some kind of error logging or throw an exception here.
      }
    } else {
      setSettings(null);
    }
  }, [setSettings]);

  useEffect(() => {
    // Monitor for changes to the browser settings (these can be triggered by actions taken in a separate browser tab).
    window.addEventListener("storage", onStorageChange);

    return () => window.removeEventListener("storage", onStorageChange);
  }, [onStorageChange]);

  useEffect(() => {
    // Restore initial settings from local storage.
    const values = localStorage.getItem("browserSettings");
    if (isNonEmptyString(values)) {
      const newSettings = JSON.parse(values);
      if (validateBrowserSettings(newSettings)) {
        setSettings(newSettings);
      } else {
        setSettings(null);  // TODO: Might want to do some kind of error logging or throw an exception here.
      }
    } else {
      setSettings(null);
    }
  }, [setSettings]);

  const newContext: BrowserSettingsContext = {
    settings: settings,
    setSettings: setSettings
  };

  return (
    <>
      <BrowserSettingsToken.Provider value={newContext}>
        {children}
      </BrowserSettingsToken.Provider>
    </>
  );
}

export function useBrowserSettings(): [settings: BrowserSettings | null, setSettings: Dispatch<BrowserSettings | null>] {
  const context = useContext(BrowserSettingsToken);
  return [context.settings, context.setSettings];
}
