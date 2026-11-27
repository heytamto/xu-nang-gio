import { useState } from 'react';
import { Sprout } from 'lucide-react';

export default function BrandLogo({ url, className = 'w-10 h-10', fallback = true }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const valid = typeof url === 'string' && /^https?:\/\//i.test(url) && failedUrl !== url;
  if (!valid && !fallback) return null;
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${className}`}>
    {valid ? <img src={url} alt="" className="w-full h-full object-contain" onError={()=>setFailedUrl(url)} /> : <Sprout className="w-5 h-5" aria-hidden="true" />}
  </span>;
}
