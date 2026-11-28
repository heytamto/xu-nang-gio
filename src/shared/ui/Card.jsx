import React from 'react';
export default function Card({as:Tag='section',className='',...props}) { return <Tag className={`xng-card ${className}`} {...props}/>; }
