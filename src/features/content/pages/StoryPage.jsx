import React, { useMemo, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Feather, Search, Sprout, Calendar, MapPin } from 'lucide-react';
import { combineArticles, filterArticles } from '../utils/articles.js';
import { formatDate } from '../../../shared/utils/dateUtils';
import { useListPagination } from '../../../shared/hooks/useListPagination';
import { ListPagination } from '../../../shared/components/ListPagination';

function Cover({article, priority=false, detail=false}) {
  const [failed,setFailed]=useState('');
  return <div className={`relative overflow-hidden bg-stone-100 ${detail?'aspect-video max-h-[480px] rounded-2xl':'aspect-[16/9]'} `}>
    {article.image && failed!==article.image ? <img src={article.image} alt={article.title} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" onError={()=>setFailed(article.image)} className={`block w-full h-full ${detail?'object-contain':'object-cover'}`} /> : <div className="absolute inset-0 grid place-items-center text-stone-400"><Sprout className="w-10 h-10" aria-hidden="true"/></div>}
  </div>;
}
function Meta({article}) {
  const Icon=article.type==='story'?Feather:BookOpen;
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-stone-500"><span className={`inline-flex items-center gap-1.5 ${article.type==='story'?'text-amber-800':'text-emerald-800'}`}><Icon className="w-4 h-4"/>{article.type==='story'?'Chuyện vườn':'Cẩm nang'}</span>{article.createdTime>0&&<span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>{formatDate(article.created_at||article.createdAt)}</span>}</div>;
}
function Card({article, featured, onOpen}) {
  return <article className={`min-w-0 overflow-hidden rounded-2xl bg-white border border-stone-200 ${featured?'lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center':''}`}>
    <button type="button" onClick={onOpen} aria-label={`Đọc ${article.title}`} className="block w-full text-left cursor-pointer"><Cover article={article} priority={featured}/></button>
    <div className={`min-w-0 flex flex-col gap-3 ${featured?'p-5 sm:p-8':'p-4 sm:p-5'}`}><Meta article={article}/><h2 className={`${featured?'text-xl sm:text-3xl':'text-base sm:text-lg'} font-bold text-stone-900 break-words line-clamp-2`}><button type="button" onClick={onOpen} className="text-left hover:text-amber-800 cursor-pointer">{article.title}</button></h2><p className={`text-sm leading-relaxed text-stone-600 break-words ${featured?'line-clamp-4':'line-clamp-2'}`}>{article.summary}</p><button type="button" onClick={onOpen} className="self-start inline-flex items-center gap-2 min-h-11 text-sm font-bold text-amber-800 cursor-pointer hover:text-amber-950">Đọc bài viết <ArrowRight className="w-4 h-4"/></button></div>
  </article>;
}
export default function StoryPage({stories=[],posts=[]}) {
  const [type,setType]=useState('all'); const [query,setQuery]=useState(''); const [selected,setSelected]=useState(null);
  const position=useRef(0); const top=useRef(null);
  const articles=useMemo(()=>combineArticles(stories,posts),[stories,posts]);
  const filtered=useMemo(()=>filterArticles(articles,type,query),[articles,type,query]);
  const {result,setPage}=useListPagination(filtered,`${type}:${query}`);
  const article=articles.find(a=>a.key===selected);
  const open=a=>{position.current=window.scrollY;setSelected(a.key);window.scrollTo(0,0);};
  const back=()=>{setSelected(null);requestAnimationFrame(()=>window.scrollTo(0,position.current));};
  if(article) return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><button type="button" onClick={back} className="min-h-11 inline-flex items-center gap-2 font-bold text-sm text-amber-800 mb-4 cursor-pointer"><ArrowLeft className="w-4 h-4"/> Quay lại bài viết</button><article className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-8 space-y-5"><Meta article={article}/><h1 className="text-2xl sm:text-4xl font-black tracking-tight break-words">{article.title}</h1><div className="flex flex-wrap gap-3 text-sm text-stone-500">{article.author&&<span>{article.author}</span>}{article.location&&<span className="inline-flex gap-1 items-center"><MapPin className="w-4 h-4"/>{article.location}</span>}</div>{article.image&&<Cover article={article} priority detail/>}{article.type==='story'&&article.quote&&article.quote!==article.body&&<blockquote className="border-l-4 border-amber-600 pl-4 text-stone-700 italic whitespace-pre-wrap break-words">{article.quote}</blockquote>}<div className="text-stone-700 leading-8 whitespace-pre-wrap break-words">{article.body}</div></article></div>;
  return <div ref={top} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 text-stone-800">
    <header className="border-b border-stone-200 pb-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-800"><Sprout className="w-4 h-4"/> Góc nhà vườn</div><h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Chuyện vườn & Cẩm nang</h1><p className="mt-2 max-w-xl text-sm sm:text-base text-stone-600 leading-relaxed">Nhật ký mùa vụ, câu chuyện nhà vườn và những mẹo nhỏ thưởng thức nông sản.</p></header>
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div className="flex flex-wrap gap-2" aria-label="Lọc bài viết">{[['all','Tất cả',articles.length],['story','Chuyện vườn',stories.length],['guide','Cẩm nang',posts.length]].map(([value,label,count])=><button key={value} type="button" aria-pressed={type===value} onClick={()=>setType(value)} className={`min-h-11 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold cursor-pointer border ${type===value?'bg-amber-800 text-white border-amber-800':'bg-white border-stone-200 text-stone-700'}`}>{label} ({count})</button>)}</div><label className="flex items-center gap-2 min-w-0 lg:w-72 bg-white rounded-xl border border-stone-200 px-3"><Search className="w-4 h-4 text-stone-500 shrink-0"/><input aria-label="Tìm bài viết" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm bài viết..." className="min-w-0 w-full h-11 text-base outline-none"/></label></div>
    {result.items.length===0?<div className="py-16 text-center bg-white rounded-2xl border border-stone-200 text-stone-600">{query.trim()?'Không tìm thấy bài viết phù hợp.':'Chưa có bài viết.'}</div>:<><div className="flex items-center justify-between"><h2 className="font-bold text-stone-900">{type==='all'&&!query.trim()&&result.currentPage===1?'Mới nhất':'Bài viết'}</h2><span className="text-sm text-stone-500">{filtered.length} bài</span></div>{type==='all'&&!query.trim()&&result.currentPage===1&&<Card article={result.items[0]} featured onOpen={()=>open(result.items[0])}/>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">{result.items.slice(type==='all'&&!query.trim()&&result.currentPage===1?1:0).map(a=><Card key={a.key} article={a} onOpen={()=>open(a)}/>)}</div><ListPagination result={result} unit="bài" onPageChange={p=>{setPage(p);top.current?.scrollIntoView({block:'start'});}}/></>}
  </div>;
}
