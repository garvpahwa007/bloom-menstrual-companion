import React from 'react';
export default function PageHeading({
  t,
  section,
  eyebrow,
  title,
  description,
  children,
  tracking = false
}) {
  const label = section ? t(`${section}.kicker`) : eyebrow;
  const heading = section ? t(`${section}.title`) : title;
  const body = section ? t(`${section}.subtitle`) : description;
  return <div className={`page-heading${tracking ? ' tracking-page-heading' : ''}`}><div>{label && <p className="eyebrow">{label}</p>}<h1>{heading}</h1>{body && <p className="muted">{body}</p>}</div>{children}</div>;
}
