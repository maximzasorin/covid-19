import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios, { AxiosResponse } from 'axios';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom';
import WebFont from 'webfontloader';
import 'leaflet/dist/leaflet.css';
import 'normalize.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons/faCircleNotch';
library.add(faCircleNotch);

import Spinner from './Spinner';
import ReportPage from './ReportPage';
import './styles.scss';

function loadFonts() {
    return new Promise((resolve) => {
        WebFont.load({
            google: {
                families: [
                    'PT Serif:400,700',
                    'PT Sans:400,700'
                ]
            },
            active: () => {
                resolve();
            },
            inactive: () => {
                resolve();
            }
        });
    });
}

interface AppProps {
    basePath: string,
    mapAccessToken: string
}

function App(props: AppProps) {
    const [ state, setState ] = useState({
        isLoading: true,
        isError: false,
        redirect: null
    });
    const [ meta, setMeta ] = useState(null);

    const axiosInstance = axios.create({
        baseURL: props.basePath
    });

    useEffect(() => {
        let redirect = null;
        if (localStorage.getItem('notFoundLocation')) {
            redirect = localStorage.getItem('notFoundLocation');
            localStorage.removeItem('notFoundLocation');
        }

        Promise.all([
                loadFonts(),
                axiosInstance.get('/data/meta.json')
            ])
            .then(([, metaRes]: [any, AxiosResponse]) => {
                setMeta(metaRes.data);

                setState({
                    isLoading: false,
                    isError: false,
                    redirect
                });
            })
            .catch((err) => {
                setState({
                    isLoading: false,
                    isError: true,
                    redirect: null
                });
            });
    }, []);

    return <React.Fragment>
        {
            (state.isLoading || state.isError)
                ? (
                    <div className="LoadingScreen">
                        <div className="LoadingScreen__Item">
                            {state.isLoading ? <Spinner /> : 'Не удалось загрузить данные ('}
                        </div>
                    </div>
                ) : (
                    <Router
                        basename={props.basePath}
                    >
                        <Switch>
                            <Route path="/:level1/:level2?">
                                {({match}) => {
                                    const path = ['WORLD'];

                                    if (match.params.level1) {
                                        path.push(match.params.level1.toUpperCase());
                                        
                                        if (match.params.level2) {
                                            path.push(match.params.level2.toUpperCase());
                                        }
                                    }

                                    return <ReportPage
                                        axios={axiosInstance}
                                        meta={meta}
                                        path={path}
                                        mapAccessToken={props.mapAccessToken}
                                    />;
                                }}
                            </Route>
                            <Route path="/">
                                <Redirect push to={state.redirect || '/ru'} />
                            </Route>
                        </Switch>
                    </Router>
                )
        }
    </React.Fragment>;
}

const appElement = document.getElementById('app');

ReactDOM.render(<App
    basePath={process.env.BASE_PATH}
    mapAccessToken={process.env.MAP_ACCESS_TOKEN}
/>, appElement);