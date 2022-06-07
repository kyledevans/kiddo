import { FunctionComponent } from "react";
import { mergeStyleSets } from "@fluentui/react";

import { TopToolbarTheme } from "../common/themes";
import { RouterCommandBarButton } from "../common/router-link";

const pageStyles = mergeStyleSets({
  pageNavigator: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gridTemplateRows: "1fr"
  },
  navigatorLinksContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "42px",
    borderRight: `1px solid ${TopToolbarTheme.palette.neutralLight}`
  },
  navigatorLink: {
    selectors: {
      " .ms-Button-label": {
        textAlign: "left"
      }
    }
  }
});

export const NavigatorContainer: FunctionComponent = ({ children }) => {
  return (
    <div className={pageStyles.pageNavigator}>
      <div className={pageStyles.navigatorLinksContainer}>
        <RouterCommandBarButton to="/profile" className={pageStyles.navigatorLink}>Profile</RouterCommandBarButton>
        <RouterCommandBarButton to="/profile/logins" className={pageStyles.navigatorLink}>Logins</RouterCommandBarButton>
      </div>
      {children}
    </div>
  );
}

export default function ProfileNavigation() {
  return (<>
    <RouterCommandBarButton to="/profile" className={pageStyles.navigatorLink}>Profile</RouterCommandBarButton>
    <RouterCommandBarButton to="/profile/logins" className={pageStyles.navigatorLink}>Logins</RouterCommandBarButton>
  </>);
}