import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useTitleEffect } from "../common/title";
import { useCurrentProfile } from "../common/current-profile";

export default function DefaultPage() {
  const navigate = useNavigate();
  const [me] = useCurrentProfile();

  useTitleEffect(null);

  useEffect(() => {
    if (me === "Anonymous" || me === "Unregistered") {
      navigate("/authentication");
    } else if (me != null) {
      navigate("/accounts");
    }
  }, [navigate, me]);

  return (
    <div></div>
  );
}