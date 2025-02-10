import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { mergeStyleSets } from "@fluentui/react";

import { useTitleEffect } from "../common/title";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr",
    overflow: "hidden",
    justifyItems: "center"
  }
});

function LogoutPageInner() {
  return (
    <div className={pageStyles.page}></div>
  );
}

function LogoutPage() {
  useTitleEffect("Logout");
  const { instance: pca } = useMsal();

  useEffect(() => {
    pca.logoutRedirect({ onRedirectNavigate: () => { return false; } });
  }, [pca]);

  return (
    <LogoutPageInner />
  );
}

export default LogoutPage;
