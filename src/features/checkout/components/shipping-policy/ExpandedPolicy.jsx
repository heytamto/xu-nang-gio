import { PolicyHeader, PolicyImage, PolicyList } from './PolicyParts';
import DeliveryTimeline from './DeliveryTimeline';
import PolicySupport from './PolicySupport';
export default function ExpandedPolicy({policy,hotline}) { return <><PolicyHeader policy={policy}/><PolicyImage policy={policy} expanded/><PolicyList items={policy.items}/>{policy.showTimeline && <DeliveryTimeline steps={policy.steps}/>}{policy.showSupport && <PolicySupport hotline={hotline} text={policy.supportText}/>}</>; }
