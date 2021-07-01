import { checkCookie } from "api";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "store.js";
import App from "./App";
import "./i18n";
import * as serviceWorker from "./serviceWorker";

checkCookie();

ReactDOM.render(
  <Provider store={store}>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
