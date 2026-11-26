import { useState } from 'react';
import { PackageCheck, ShieldCheck, Headphones, Sprout, Truck, HeartHandshake, Phone, Clock, BadgeCheck } from 'lucide-react';
export const POLICY_ICONS = { PackageCheck, ShieldCheck, Headphones, Sprout, Truck, HeartHandshake, Phone, Clock, BadgeCheck };
export const POLICY_COLORS = { amber:'bg-amber-100 text-amber-800', emerald:'bg-emerald-100 text-emerald-800', blue:'bg-blue-100 text-blue-800', stone:'bg-stone-100 text-stone-700' };
export function PolicyIcon({item, small=false}) {
  const Icon = POLICY_ICONS[item.icon] || ShieldCheck;
  return <span className={`${small?'size-8':'size-10'} ${POLICY_COLORS[item.color] || POLICY_COLORS.amber} rounded-xl flex items-center justify-center shrink-0`}><Icon className="size-5" aria-hidden="true"/></span>;
}
export function PolicyHeader({policy, compact=false}) {
  return <div className="flex items-start gap-2.5"><HeartHandshake className="size-5 text-amber-700 shrink-0 mt-0.5"/><div className="min-w-0 flex-1"><h3 className="font-black text-sm sm:text-base text-amber-950 leading-snug">{policy.title}</h3>{!compact && policy.subtitle && <p className="text-xs text-stone-500 mt-1">{policy.subtitle}</p>}</div>{policy.badge && <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 rounded-full px-2 py-1 shrink-0 max-w-[40%] break-words">{policy.badge}</span>}</div>;
}
export function PolicyList({items}) {
  return <div className="divide-y divide-stone-200/80">{items.map((item,i)=><div key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"><PolicyIcon item={item}/><div className="min-w-0"><h4 className="font-bold text-sm text-stone-900 break-words">{item.title}</h4><p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-words mt-0.5">{item.description}</p></div></div>)}</div>;
}
export function PolicyImage({policy, expanded=false}) {
  const [failedUrl, setFailedUrl] = useState(null);
  if (!policy.image || failedUrl === policy.image) return null;
  return <figure className="space-y-1"><div className={`relative overflow-hidden rounded-xl bg-stone-100 ${expanded?'aspect-[2/1]':'aspect-[3/1]'}`}><img src={policy.image} alt={policy.imageAlt || 'Ảnh đóng gói'} className="absolute inset-0 w-full h-full object-cover" onError={()=>setFailedUrl(policy.image)}/></div>{policy.imageAlt && <figcaption className="text-xs text-stone-500">{policy.imageAlt}</figcaption>}</figure>;
}
