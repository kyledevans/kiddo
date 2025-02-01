import { useCallback, useState, useEffect, FunctionComponent, createContext, useRef, useContext } from "react";
import { IIconProps, Callout, mergeStyleSets, Icon, Text } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";

const snackbarStyles = mergeStyleSets({
  anchor: {
    display: "grid",
    justifyContent: "center",
    gridTemplateColumns: "500px",
    gridColumn: "1 / span 2"
  },
  callout: {
    cursor: "default",
    selectors: {
      ".ms-Callout-beak": {
        backgroundColor: "rgb(51, 51, 51)"
      },
      ".ms-Callout-beakCurtain": {
        backgroundColor: "rgb(51, 51, 51)"
      },
      ".ms-Callout-main": {
        display: "grid",
        gridTemplateColumns: "1fr min-content",
        backgroundColor: "rgb(51, 51, 51)",
        padding: 0,
        width: 500,
        color: "#fff"
      }
    }
  },
  message: {
    color: "#fff",
    padding: "8px 0 8px 16px"
  },
  closeIcon: {
    alignSelf: "stretch",
    padding: "0 16px 0 16px",
    cursor: "pointer",
    display: "grid",
    alignItems: "center"
  }
});

const closeIcon: IIconProps = { iconName: "ChromeClose" };

/** Provides access to the page title. */
const SnackbarToken = createContext<SnackbarContext>({
  open: () => { }
});

export const AppSnackbarContextProvider: FunctionComponent = (props) => {
  const newContext: SnackbarContext = {
    open: () => { }
  };

  return (
    <SnackbarToken.Provider value={newContext}>{props.children}</SnackbarToken.Provider>
  );
}

function SnackbarAnchor() {
  return (
    <div className={snackbarStyles.anchor}><div id="app-snackbar-anchor"></div></div>
  );
}

export const Snackbar: FunctionComponent = () => {
  const [message, setMessage] = useState<string | null>(null);
  const context = useContext(SnackbarToken);
  const [isVisible, { setTrue: setIsVisible, setFalse: setIsHidden }] = useBoolean(false);
  const cancelTimeoutRef = useRef<null | (() => void)>(null);

  const open = useCallback((message: string) => {
    // Clear any pending timeouts.
    if (cancelTimeoutRef.current != null) {
      cancelTimeoutRef.current();
    }

    setMessage(message);
    setIsVisible();

    const timeoutHandle = setTimeout(() => {
      setIsHidden();
      cancelTimeoutRef.current = null;
    }, 5000);

    cancelTimeoutRef.current = () => {
      clearTimeout(timeoutHandle);
      cancelTimeoutRef.current = null;
    };
  }, [setIsVisible, setIsHidden, cancelTimeoutRef]);

  useEffect(() => {
    context.open = open;
  }, [context, open]);

  useEffect(() => {
    return () => {
      if (cancelTimeoutRef.current != null) {
        cancelTimeoutRef.current();
      }
    };
  }, [cancelTimeoutRef]);

  return (
    <>
      <SnackbarAnchor />
      {isVisible && (
        <Callout target="#app-snackbar-anchor" preventDismissOnEvent={() => true} className={snackbarStyles.callout} isBeakVisible={false} gapSpace={8}><Text variant="medium" className={snackbarStyles.message}>{message}</Text><Icon className={snackbarStyles.closeIcon} iconName={closeIcon.iconName} onClick={setIsHidden} /></Callout>
      )}
    </>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarToken);
  return context;
}

interface SnackbarContext {
  open: (message: string) => void
}
