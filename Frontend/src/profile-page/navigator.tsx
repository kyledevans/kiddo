import { mergeStyleSets } from "@fluentui/react";

import { RouterCommandBarButton } from "../common/router-link";

const pageStyles = mergeStyleSets({
  navigatorLink: {
    selectors: {
      " .ms-Button-label": {
        textAlign: "left"
      }
    }
  }
});

export default function ProfileNavigation() {
  return (<>
    <RouterCommandBarButton to="/profile" className={pageStyles.navigatorLink}>Profile</RouterCommandBarButton>
    <RouterCommandBarButton to="/profile/logins" className={pageStyles.navigatorLink}>Logins</RouterCommandBarButton>
  </>);
}