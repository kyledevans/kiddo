import { createContext, FunctionComponent, useEffect, useContext } from "react";
import { useBoolean } from "@fluentui/react-hooks";
import { useHistory } from "react-router-dom";
import { useFormState } from "react-hook-form";

const DirtyToken = createContext<DirtyContext>({
  isDirty: false,
  setDirty: () => { throw new Error("AppDirtyContextToken has not yet been initialized."); },
  setNotDirty: () => { throw new Error("AppDirtyContextToken has not yet been initialized."); }
});

export interface DirtyContext {
  isDirty: boolean;
  setDirty: () => void;
  setNotDirty: () => void;
}

export function useDirty(): DirtyContext {
  const context = useContext(DirtyToken);
  return {
    isDirty: context.isDirty,
    setDirty: context.setDirty,
    setNotDirty: context.setNotDirty
  };
}

export function useDirtyReactHookForm(): boolean {
  const { isDirty } = useFormState();
  const { setDirty, setNotDirty } = useContext(DirtyToken);

  useEffect(() => {
    if (isDirty) {
      setDirty();
    } else {
      setNotDirty();
    }
  }, [isDirty, setDirty, setNotDirty]);

  return isDirty;
}

function onBeforeUnload(ev: BeforeUnloadEvent) {
  ev.returnValue = "Changes you made will not be saved.";
  return "Changes you made will not be saved.";
}

export const DirtyProvider: FunctionComponent = (props) => {
  const [isDirty, { setTrue: setDirty, setFalse: setNotDirty }] = useBoolean(false);
  const history = useHistory();

  // Prompt the user if they attempt to navigate away using the address bar.
  useEffect(() => {
    if (isDirty) {
      window.addEventListener("beforeunload", onBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", onBeforeUnload);
      };
    }
  }, [isDirty]);

  // Prompt the user if they attempt to navigate away using a form of react routing.  Ex: Clicking on a react router link.
  useEffect(() => {
    if (isDirty) {
      const removeListener = history.block((_l, action) => {
        if (action === "PUSH") {
          return "Changes you made will not be saved.";
        }
      });

      return removeListener;
    }
  }, [isDirty, history]);

  const newContext: DirtyContext = {
    isDirty,
    setDirty,
    setNotDirty
  };

  return (
    <>
      <DirtyToken.Provider value={newContext}>{props.children}</DirtyToken.Provider>
    </>
  );
}
