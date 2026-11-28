import React from 'react';
export default function PageHeader({ eyebrow, icon: Icon, title, description, actions, variant = 'standard' }) {
  return <header className="xng-page-header">
    {eyebrow && <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">{Icon && <Icon className="size-4" aria-hidden="true" />}{eyebrow}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className={`xng-heading ${variant === 'compact' ? 'xng-heading--compact' : ''}`}>{title}</h1>{actions}</div>
    {description && <p>{description}</p>}
  </header>;
}
