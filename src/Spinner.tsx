import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function() {
    return <div className="Spinner">
        <FontAwesomeIcon
            icon="circle-notch"
            spin={true}
        />
    </div>;
}