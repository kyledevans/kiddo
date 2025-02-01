import { FunctionComponent } from "react";
import { IIconProps, mergeStyleSets } from "@fluentui/react";

import { RouterCommandBarButton } from "./router-link";
import { AppTheme } from "./themes";

const styles = mergeStyleSets({
  toolbar: {
    display: "grid",
    gridTemplateColumns: "min-content min-content min-content",
    justifyContent: "space-between",
    height: 44
  },
  toolbarColumn1: {
    display: "flex",
    gridColumn: "1 / span 1",
    whiteSpace: "nowrap"
  },
  toolbarColumn2: {
    display: "flex",
    gridColumn: "2 / span 1",
    whiteSpace: "nowrap"
  },
  toolbarColumn3: {
    display: "flex",
    gridColumn: "3 / span 1",
    whiteSpace: "nowrap"
  },
  backButton: {
    paddingRight: 32
  }
});

export const Toolbar: FunctionComponent<{}> = ({ children }) => {
  return (
    <div className={styles.toolbar}>
      {children}
    </div>
  );
};

export const ToolbarColumn1: FunctionComponent = ({ children }) => {
  return (<div className={styles.toolbarColumn1}>{children}</div>);
}

export const ToolbarColumn2: FunctionComponent = ({ children }) => {
  return (<div className={styles.toolbarColumn2}>{children}</div>);
}

export const ToolbarColumn3: FunctionComponent<{ className?: string | null }> = (props) => {
  return (<div {...props} className={`${styles.toolbarColumn3}${props.className == null ? "" : (" " + props.className)}`}>{props.children}</div>);
}

const icons: { back: IIconProps } = {
  back: { iconName: "Back", styles: { root: { color: AppTheme.palette.neutralDark } } }
};

export const ToolbarBackButton: FunctionComponent<{ to: string }> = ({ to, children }) => {
  return (<RouterCommandBarButton className={styles.backButton} tabIndex={-1} to={to} iconProps={icons.back}>Back</RouterCommandBarButton>);
}
