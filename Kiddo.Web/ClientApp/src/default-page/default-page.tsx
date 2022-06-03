import { useEffect } from "react";
import { useHistory } from "react-router";

import { useTitleEffect } from "../common/title";
import { useCurrentProfile } from "../common/current-profile";

export default function DefaultPage() {
  const history = useHistory();
  const [me] = useCurrentProfile();

  useTitleEffect(null);

  useEffect(() => {
    if (me === "Anonymous" || me === "Unregistered") {
      history.push("/authentication");
    } else if (me != null) {
      history.push("/accounts");
    }
  }, [history, me]);

  return (
    <div></div>
  );
}