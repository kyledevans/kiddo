import { useCallback, useEffect, useRef, FunctionComponent, MutableRefObject } from "react";
import { IIconProps, Callout, Icon, Target } from "@fluentui/react";
import { mergeStyleSets } from "@fluentui/react/lib/Styling";
import { useBoolean } from "@fluentui/react-hooks";

const errorCalloutStyles = mergeStyleSets({
  callout: {
    cursor: "default",
    selectors: {
      ".ms-Callout-beak": {
        backgroundColor: "rgb(253, 161, 163)"
      },
      ".ms-Callout-beakCurtain": {
        backgroundColor: "rgb(253, 161, 163)"
      },
      ".ms-Callout-main": {
        display: "grid",
        gridTemplateColumns: "max-content min-content",
        backgroundColor: "rgb(253, 161, 163)",
        padding: "8px 16px"
      }
    }
  },
  errorIcon: {
    padding: "0 0 0 8px"
  }
});

const errorCalloutIcon: IIconProps = { iconName: "ErrorBadge" };

export interface ErrorCalloutControl {
  dismiss: () => void;
  open: (duration: number) => void;
}

export const ErrorCallout: FunctionComponent<{ target: Target, control: MutableRefObject<ErrorCalloutControl | null> }> = ({ target, control, children }) => {
  const [isVisible, { setTrue: setIsVisible, setFalse: setIsHidden }] = useBoolean(false);
  const cancelTimeoutRef = useRef<null | (() => void)>(null);

  const open = useCallback((duration: number) => {
    // Clear any pending timeouts.
    if (cancelTimeoutRef.current != null) {
      cancelTimeoutRef.current();
    }

    setIsVisible();

    const timeoutHandle = setTimeout(() => {
      setIsHidden();
      cancelTimeoutRef.current = null;
    }, duration);

    cancelTimeoutRef.current = () => {
      clearTimeout(timeoutHandle);
      cancelTimeoutRef.current = null;
    };
  }, [setIsVisible, setIsHidden, cancelTimeoutRef]);

  useEffect(() => {
    control.current = {
      dismiss: setIsHidden,
      open: open
    };

    return () => {
      if (cancelTimeoutRef.current != null) {
        cancelTimeoutRef.current();
      }
    };
  }, [control, setIsHidden, open, cancelTimeoutRef]);

  return (
    <>
      {isVisible && (
        <Callout dismissOnTargetClick={true} target={target} onDismiss={setIsHidden} onClick={setIsHidden} className={errorCalloutStyles.callout}>{children}<Icon className={errorCalloutStyles.errorIcon} iconName={errorCalloutIcon.iconName} /></Callout>
      )}
    </>
  );
}
