import { useLayoutEffect, useRef, useState } from 'react';
import { useShippingPolicy } from '../../shop-config/services/shippingPolicy';
import CompactPolicy from './shipping-policy/CompactPolicy';
import StandardPolicy from './shipping-policy/StandardPolicy';
import LargePolicy from './shipping-policy/LargePolicy';
import ExpandedPolicy from './shipping-policy/ExpandedPolicy';
import { choosePolicyLayout, MODES } from './shipping-policy/policyLayout.mjs';
import DeliveryTimeline from './shipping-policy/DeliveryTimeline';
import PolicySupport from './shipping-policy/PolicySupport';
function StandardSupport(props) { return <><StandardPolicy {...props}/>{props.policy.showSupport && <PolicySupport hotline={props.hotline} text={props.policy.supportText}/>}</>; }
function StandardTimeline(props) { return <><StandardPolicy {...props}/>{props.policy.showTimeline && <DeliveryTimeline steps={props.policy.steps}/>}</>; }
function StandardPlus(props) { return <><StandardTimeline {...props}/>{props.policy.showSupport && <PolicySupport hotline={props.hotline} text={props.policy.supportText}/>}</>; }
const layouts = {compact:CompactPolicy,standard:StandardPolicy,standardSupport:StandardSupport,standardTimeline:StandardTimeline,standardPlus:StandardPlus,large:LargePolicy,expanded:ExpandedPolicy};
const shell='rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/60 via-white to-stone-50 p-3 sm:p-4 flex flex-col gap-3 min-w-0';
export default function ShippingPolicyCard({budget=null, hotline, shopConfig={}, previewPolicy, previewMode}) {
  const {data} = useShippingPolicy();
  const policy = previewPolicy ?? data;
  const probe=useRef(null);
  const [heights,setHeights]=useState({});
  const active=Boolean(policy?.enabled && Array.isArray(policy?.items) && policy.items.length);
  useLayoutEffect(()=>{
    if(!active || budget==null || !probe.current)return;
    const root=probe.current;
    const measure=()=>{
      const next=Object.fromEntries([...root.children].map(el=>[el.dataset.mode,Math.ceil(el.getBoundingClientRect().height)]));
      setHeights(prev=>MODES.every(m=>prev[m]===next[m])?prev:next);
    };
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    for(const el of root.children)observer?.observe(el);
    measure();
    return ()=>observer?.disconnect();
  },[active,budget==null,policy]);
  if(!active)return null;
  const phone=hotline||shopConfig?.hotline||shopConfig?.general?.hotline;
  const mode=MODES.includes(previewMode)?previewMode:choosePolicyLayout(budget,heights);
  const Layout=layouts[mode];
  return <div className="relative min-w-0"><section className={shell} data-policy-layout={mode}><Layout policy={policy} hotline={phone}/></section>{budget!=null&&<div ref={probe} aria-hidden="true" inert className="absolute inset-x-0 top-0 h-0 overflow-hidden invisible pointer-events-none">{MODES.map(m=>{const Variant=layouts[m];return <div key={m} data-mode={m} className={shell}><Variant policy={policy} hotline={phone}/></div>;})}</div>}</div>;
}
