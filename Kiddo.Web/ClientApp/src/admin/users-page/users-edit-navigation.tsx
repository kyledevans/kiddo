import { mergeStyleSets } from "@fluentui/react";
import { useParams } from "react-router-dom";

import { RouterCommandBarButton } from "../../common/router-link";
import { GuidEmpty } from "../../api/constants";
import { FunctionComponent } from "react";
import { PolicyType, withRequiredPolicy } from "../../common/current-authorization";
import { withRequiredProfile } from "../../common/current-profile";

const navigationStyles = mergeStyleSets({
  navigatorLink: {
    selectors: {
      " .ms-Button-label": {
        textAlign: "left"
      }
    }
  }
});

let UsersEditNavigation: FunctionComponent = () => {
  const { userId: userIdStr } = useParams<{ userId?: string | undefined }>();
  const userId = userIdStr == null ? GuidEmpty : userIdStr;

  // Don't show navigation panel for new users.
  if (userId == GuidEmpty) {
    return <></>;
  }

  return (<>
    <RouterCommandBarButton to={`/admin/users/edit/${userId}`} className={navigationStyles.navigatorLink}>Profile</RouterCommandBarButton>
    <RouterCommandBarButton to={`/admin/users/edit/${userId}/logins`} className={navigationStyles.navigatorLink}>Logins</RouterCommandBarButton>
  </>);
}

UsersEditNavigation = withRequiredPolicy(UsersEditNavigation, PolicyType.SuperAdministrator, false);

export default UsersEditNavigation;
