import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import WebFont from 'webfontloader';
import 'leaflet/dist/leaflet.css';
import 'normalize.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons/faCircleNotch';
library.add(faCircleNotch);

import Report from './Report';
import { fixChukotka } from './RussiaMap';
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

function Spinner() {
    return <div className="Spinner">
        <FontAwesomeIcon
            icon="circle-notch"
            spin={true}
        />
    </div>;
}

function App() {
    const [ state, setState ] = useState({
        isLoading: true,
        isError: false
    });
    const [ regions, setRegions ] = useState(null);
    const [ map, setMap ] = useState(null);
    const [ report, setReport ] = useState(null);

    useEffect(() => {
        loadFonts()
            .then(() => {
                return Promise.all([
                    axios.get('/data/russia.geojson'),
                    axios.get('/data/russia-regions.json'),
                    axios.get('/data/report.json')
                ]);
            })
            .then((responses) => {
                return responses.map((res) => {
                    return res.data;
                });
            })
            .then((data) => {
                fixChukotka(data[0]);

                setMap(data[0]);
                setRegions(data[1]);
                setReport(data[2]);

                setState({
                    isLoading: false,
                    isError: false
                });
            })
            .catch((err) => {
                console.log(err);
                setState({
                    isLoading: false,
                    isError: true
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
                    <Report
                        map={map}
                        regions={regions}
                        data={report}
                    />
                )
        }
    </React.Fragment>;
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
);