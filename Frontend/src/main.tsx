import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

import "./index.scss";
import App from "./App";

initializeIcons();
library.add(fas, fab);

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
