import React from 'react';
const variants = {primary:'bg-brand-700 text-white hover:bg-brand-900',secondary:'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50',danger:'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'};
export default function Button({variant='primary',className='',type='button',...props}) {return <button type={type} className={`xng-control xng-focus inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`} {...props}/>;}
