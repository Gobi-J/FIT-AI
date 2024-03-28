import React from "react";
import Router from "./Router";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Route } from 'react-router-dom';
import { Switch } from "react-router-dom/cjs/react-router-dom.min";
import Landing from '../Landing/Landing'

function App(props) {
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* <Switch>
            <Route path='/' element={<Landing />} />
            <Route path='/signin' element={<Router />} />
        </Switch> */}
        <Router />
      </LocalizationProvider>
    </>
  );
}

export default App;
