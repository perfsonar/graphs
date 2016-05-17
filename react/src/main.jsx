/**
 *  Copyright (c) 2015, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint max-len:0 */

import React from "react";
import { render } from "react-dom";
import { Router, Route, IndexRoute, browserHistory } from "react-router";

import Chart1 from "./chart1";

import createHistory from "history/lib/createHashHistory";
import useScroll from "scroll-behavior/lib/useStandardScroll";

const history = useScroll(createHistory)();

render((
    <Router history={history}>
        <Route path="/" component={Chart1}>
        </Route>
    </Router>
), document.getElementById("content"));
