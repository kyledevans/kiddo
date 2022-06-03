import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

import reportWebVitals from "./reportWebVitals";
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
