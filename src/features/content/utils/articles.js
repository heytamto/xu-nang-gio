const text = (...values) => values.find(v => typeof v === 'string' && v.trim())?.trim() || '';
export function combineArticles(stories = [], posts = []) {
  return [...stories.map(row => ({row, type:'story'})), ...posts.map(row => ({row, type:'guide'}))].map(({row,type}) => {
    const body = type === 'story' ? text(row.story,row.content,row.quote) : text(row.content,row.excerpt,row.description);
    return {...row,type,key:`${type}:${row.id}`,title:text(row.title)||'Bài viết',image:text(row.image,row.image_url),body,summary:type==='story'?text(row.quote,body):text(row.excerpt,row.description,body),createdTime:Date.parse(row.created_at||row.createdAt)||0};
  }).sort((a,b)=>b.createdTime-a.createdTime || a.key.localeCompare(b.key));
}
const fold = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
export function filterArticles(items, type, query) {
  const terms=fold(query).trim().split(/\s+/).filter(Boolean);
  return items.filter(a=>(type==='all'||a.type===type)&&terms.every(t=>fold([a.title,a.summary,a.author,a.location].join(' ')).includes(t)));
}
