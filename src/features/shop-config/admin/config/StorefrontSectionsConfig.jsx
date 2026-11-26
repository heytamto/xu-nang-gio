import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, Save, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ImageUploadField from '../../../../shared/components/ImageUploadField';
import CustomDropdown from '../../../../shared/components/CustomDropdown';
import { useStorefrontSections, saveStorefrontSection, sectionQueryKey } from '../../services/storefrontSections';

const guideFields = { tabLabel:'Tên tab', title:'Tiêu đề', origin:'Nguồn gốc', badge:'Nhãn', fakeWarning:'Cảnh báo chất lượng', storageTip:'Mẹo bảo quản' };
const harvestFields = { title:'Tiêu đề', highlight:'Nông sản nổi bật', status:'Trạng thái mùa vụ', categoryTarget:'ID danh mục (all = tất cả)', desc:'Mô tả', tips:'Mẹo chọn mua' };
const destinationFields = { spot:'Địa điểm', badge:'Nhãn', bestTime:'Thời gian phù hợp', tagline:'Lời giới thiệu', experience:'Trải nghiệm' };
const inputClass = 'w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm focus:outline-none focus:border-amber-600';
function Field({ label, value, onChange, multiline = false, fullWidth = false }) {
  const Tag = multiline ? 'textarea' : 'input';
  return <label className={`block min-w-0 space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}><span className="text-xs font-bold text-stone-700">{label}</span><Tag className={`${inputClass} ${multiline ? 'block min-h-[96px] resize-y leading-relaxed' : 'h-11'}`} value={value ?? ''} onChange={e => onChange(e.target.value)} {...(multiline ? {rows:3} : {})}/></label>;
}
function SectionEditor({ sectionKey, initial, onShowAlert, setConfirmModalConfig }) {
  const guide = sectionKey === 'experience_guide';
  const Icon = guide ? BookOpen : CalendarDays;
  const [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const uploading = uploadCount > 0;
  const handleUploadState = active => setUploadCount(n => Math.max(0, n + (active ? 1 : -1)));
  const updateMonthImage = (month, destination, url) => setDraft(prev => ({
    ...prev, items: prev.items.map(x => x.month !== month ? x : destination
      ? {...x, destination: {...x.destination, image: url}}
      : {...x, image: url})
  }));
  const [error, setError] = useState('');
  const client = useQueryClient();
  const items = draft.items;
  const item = items[selected];
  const update = (key,value) => setDraft(prev => ({...prev,[key]:value}));
  const editItem = (patch) => setDraft(prev => ({...prev, items:prev.items.map((x,i)=>i===selected ? {...x,...patch}:x)}));
  const move = (delta) => { const next=selected+delta; if(next<0||next>=items.length)return; const arr=[...items]; [arr[selected],arr[next]]=[arr[next],arr[selected]]; update('items',arr);setSelected(next); };
  const add = () => { if(items.length>=50)return; update('items',[...items,{id:crypto.randomUUID(),tabLabel:'Mục mới',title:'',origin:'',badge:'',realSigns:[],fakeWarning:'',storageTip:''}]);setSelected(items.length); };
  const remove = () => { update('items',items.filter((_,i)=>i!==selected));setSelected(Math.max(0,selected-1)); };
  const save = async () => {
    if(saving || uploading)return; setError('');setSaving(true);
    try {
      if(!draft.title.trim()||!draft.subtitle.trim()|| (draft.enabled&&!items.length)||items.some(x=>!x.title.trim()||(guide&&!x.tabLabel.trim()))) throw new Error('Vui lòng nhập đủ tiêu đề và tên mục.');
      await saveStorefrontSection(sectionKey,draft);
      client.setQueryData(sectionQueryKey,prev=>({...prev,[sectionKey]:draft}));
      await client.invalidateQueries({queryKey:sectionQueryKey});
      onShowAlert?.('Đã lưu nội dung trang chủ.');
    } catch(e){setError(e.message||'Không thể lưu cấu hình.');} finally {setSaving(false);}
  };
  return <section className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 space-y-4">
    <div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-amber-50 text-amber-800"><Icon className="w-5 h-5"/></div><h3 className="font-black text-lg">{guide?'Cẩm nang kinh nghiệm':'Lịch mùa vụ & trải nghiệm'}</h3></div>
    <fieldset disabled={saving || uploading} className="space-y-4 min-w-0">
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.enabled} onChange={e=>update('enabled',e.target.checked)}/> Hiển thị ngoài trang chủ</label>
      <Field label="Tiêu đề section" value={draft.title} onChange={v=>update('title',v)}/>
      <Field label="Dòng giới thiệu" value={draft.subtitle} onChange={v=>update('subtitle',v)}/>
      {guide && <div className="grid sm:grid-cols-2 gap-3"><Field label="Cam kết trái" value={draft.footerLeft} onChange={v=>update('footerLeft',v)}/><Field label="Cam kết phải" value={draft.footerRight} onChange={v=>update('footerRight',v)}/></div>}
      <div className="flex flex-wrap items-end gap-2"><div className="flex-1 min-w-[180px]">{items.length>0&&<CustomDropdown label={guide?'Mục kinh nghiệm':'Tháng'} options={items.map((x,i)=>({value:String(i),label:guide?`${i+1}. ${x.tabLabel}`:`Tháng ${x.month}`}))} value={String(selected)} onChange={v=>setSelected(Number(v))} searchable={guide}/>}</div>
      {guide&&<><button type="button" className="p-3 rounded-xl border" onClick={add} disabled={items.length>=50} title="Thêm mục"><Plus className="w-4 h-4"/></button><button type="button" className="p-3 rounded-xl border" onClick={()=>move(-1)} disabled={selected===0} title="Lên"><ChevronUp className="w-4 h-4"/></button><button type="button" className="p-3 rounded-xl border" onClick={()=>move(1)} disabled={selected>=items.length-1} title="Xuống"><ChevronDown className="w-4 h-4"/></button><button type="button" className="p-3 rounded-xl border text-rose-700" disabled={!item} onClick={()=>setConfirmModalConfig({title:'Xóa mục kinh nghiệm?',message:'Mục sẽ bị xóa khỏi bản nháp. Bấm Lưu để áp dụng.',onConfirm:remove})} title="Xóa mục"><Trash2 className="w-4 h-4"/></button></>}
      </div>
      {item&&<div className="border border-stone-200 rounded-2xl p-4 space-y-3"><div className="grid sm:grid-cols-2 gap-3">{Object.entries(guide?guideFields:harvestFields).map(([k,label])=><Field key={k} label={label} value={item[k]} onChange={v=>editItem({[k]:v})} multiline={['fakeWarning','storageTip','desc','tips'].includes(k)}/>)}</div>
      {!guide && <ImageUploadField key={`harvest-${item.month}`} label="Ảnh nông sản" bucket="images" value={item.image || ''} onChange={url=>updateMonthImage(item.month,false,url)} onUploadStateChange={handleUploadState}/> }
      {guide?<Field label="Dấu hiệu nhận biết (mỗi dòng một ý)" value={item.realSigns.join('\n')} onChange={v=>editItem({realSigns:v.split('\n')})} multiline/>:<><h4 className="font-bold pt-4 border-t border-stone-100">Điểm đến & trải nghiệm</h4><div className="grid sm:grid-cols-2 gap-3">{Object.entries(destinationFields).map(([k,label])=><Field key={k} label={label} value={item.destination[k]} onChange={v=>editItem({destination:{...item.destination,[k]:v}})} multiline={['tagline','experience'].includes(k)} fullWidth={k==='spot'}/>)}</div><ImageUploadField key={`destination-${item.month}`} label="Ảnh địa điểm" bucket="images" value={item.destination?.image || ''} onChange={url=>updateMonthImage(item.month,true,url)} onUploadStateChange={handleUploadState}/></>}
      </div>}
      {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex items-center justify-end pt-3 border-t border-stone-100">
        <button type="button" onClick={save} disabled={saving || uploading} className="flex items-center gap-2 bg-amber-800 text-white font-bold rounded-xl px-5 py-3 disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Đang lưu…':uploading?'Đang tải ảnh…':'Lưu cấu hình'}</button>
      </div>
    </fieldset>
  </section>;
}
export default function StorefrontSectionsConfig(props) {
  const {data,isPending,isError,refetch}=useStorefrontSections();
  if(isPending)return <p>Đang tải nội dung trang chủ…</p>;
  if(isError||!data?.experience_guide||!data?.harvest_calendar)return <div className="p-4 text-rose-700">Không tải được cấu hình trang chủ. Kiểm tra migration. <button type="button" onClick={()=>refetch()} className="underline">Thử lại</button></div>;
  return <div className="space-y-5">{['experience_guide','harvest_calendar'].map(k=><SectionEditor key={k} sectionKey={k} initial={data[k]} {...props}/>)}</div>;
}
