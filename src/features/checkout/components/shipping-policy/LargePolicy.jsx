import { PolicyHeader, PolicyImage, PolicyList } from './PolicyParts';
import DeliveryTimeline from './DeliveryTimeline';
export default function LargePolicy({policy}) { return <><PolicyHeader policy={policy}/><PolicyImage policy={policy}/><PolicyList items={policy.items}/>{!policy.image && policy.showTimeline && <DeliveryTimeline steps={policy.steps}/>}</>; }
