import React from "react";
import { Redirect, Route } from "react-router-dom";
import Header from "./Header";

function PrivateRoute(props) {
  return props.state.loggedIn ? (
    <Route path={props.path}>
      <Header state={props.state} dispatch={props.dispatch} />
      <>{props.children}</>
    </Route>
  ) : (
    props.path !== '/signin' ?
        <Redirect to="/home" /> : null
  );
}

export default PrivateRoute;
