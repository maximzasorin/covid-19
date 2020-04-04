import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

import Report from './Report';
import { fixChukotka } from './RussiaMap';

function App() {
    const [ isLoading, setLoading ] = useState(true);
    const [ isError, setError ] = useState(false);
    const [ regions, setRegions ] = useState(null);
    const [ map, setMap ] = useState(null);
    const [ report, setReport ] = useState(null);

    useEffect(() => {
        Promise.all([
                axios.get('/data/russia.geojson'),
                axios.get('/data/russia-regions.json'),
                axios.get('/data/report.json')
            ])
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

                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                setError(true);
            });
    }, []);

    return <div className="Page">
        <header className="Page__Header">
            <h1>
                COVID-19 в России
            </h1>
        </header>
        <main className="Page__Main">
            {
                isLoading
                    ? 'Loading...'
                    : (
                        isError
                            ? 'error'
                            : <Report
                                    map={map}
                                    regions={regions}
                                    data={report}
                                />
                    )
            }
        </main>
    </div>;
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
);