/** @file Application title service.  Provides functionality to update the title in the DOM and in the browser window. */

import { createContext, useState, FunctionComponent, useEffect, useContext } from "react";

import { isNonEmptyString } from "./helper-functions";
import { AppName } from "./constants";

/** Provides access to the page title. */
const TitleToken = createContext<TitleContext>({
  appTitle: AppName,
  setAppTitle: () => { throw new Error("AppTitleContext has not yet been initialized."); }
});

/**
 * Set the application title from within a component's Render() method.
 * @param newTitle
 */
export function useTitleEffect(newTitle: string | null) {
  const { setAppTitle } = useContext(TitleToken);

  useEffect(() => {
    setAppTitle(newTitle);
  }, [newTitle, setAppTitle]);
}

/** Access to the application title. */
export function useTitle(): [appTitle: string | null, setAppTitle: (newAppTitle: string | null) => void] {
  const { appTitle, setAppTitle } = useContext(TitleToken);

  return [appTitle, setAppTitle];
}

/** Initializes the page title singleton.  This should only be used in 1 place in the app.  Typically at or near the top level component. */
export const AppTitleContextProvider: FunctionComponent = (props) => {
  const [appTitle, setAppTitle] = useState<string | null>(AppName);

  useEffect(() => {
    if (isNonEmptyString(appTitle) && appTitle !== AppName) {
      document.title = `${appTitle} - ${AppName}`;
    } else {
      document.title = `${AppName}`;
    }
  }, [appTitle]);

  const newContext: TitleContext = {
    appTitle,
    setAppTitle
  };

  return (
    <>
      <TitleToken.Provider value={newContext}>{props.children}</TitleToken.Provider>
    </>
  );
}

export interface TitleContext {
  readonly appTitle: string | null;
  /** Set the page title.  This can only be called OUTSIDE of a render method.  For example to set the title from within an event handler, or after an async call, use this method. */
  setAppTitle: (newAppTitle: string | null) => void;
}
