
'use client';

import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const parse = (event) => {
  try { return JSON.parse(event.data); } catch { return null; }
};

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState('Conectando…');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch(`${API}/api/articles`);
        if (!response.ok) throw new Error('API unavailable');
        const data = await response.json();
        const temp ={
            "sentiment": "neutral",
            "confidence": 0.9,
            "categories": [
                "tech_news"
            ],
            "model": "gemini-3.5-flash-lite"
        }
        data.forEach(article => {
          try{
            article.extra = JSON.parse(article.content || '{}');
          } catch {
            article.extra = {};
          }
        });
        if (alive) { setArticles(data); setStatus('En directo'); }
      } catch { if (alive) setStatus('API no disponible'); }
    };

    const handlers = {
      connected: () => setStatus('En directo'),
      'worker.status': (event) => {
        const payload = parse(event);
        console.log('Worker status event received:', payload);        
        if(payload?.status === 'scan') {
          setStatus('Escaneando...');
          return;
        }
        setStatus('En directo')
      },
      'article.processed': (event) => {
        const payload = parse(event);

        if (payload?.article) {
          try{
            payload.article.extra = JSON.parse(payload.article.content || '{}');
          } catch {
            payload.article.extra = {};
          }
          setArticles((prev) => [
            payload.article,
            ...prev.filter((a) => a.id != payload.article.id),
          ]);          
        }
      },
    };
    
    load();

    const stream = new EventSource(`${API}/api/events`);
    for (const [type, handler] of Object.entries(handlers)) {
      stream.addEventListener(type, (event) => alive && handler(event));
    }

    stream.onerror = () => alive && setStatus('Reconectando…');
    const timer = setInterval(load, 60000);
    return () => { alive = false; stream.close(); clearInterval(timer); };
  }, []);

  return <main className="mx-auto max-w-5xl px-6 py-16 max-sm:px-4 max-sm:py-8">
    <header className="mb-12 flex items-start justify-between gap-6 max-sm:flex-col">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-primary">NEWS INTELLIGENCE</p>
        <h1 className="my-2 text-4xl font-bold tracking-tight sm:text-5xl">Monitor de noticias</h1>
        <p className="text-muted-foreground">Fuentes, artículos y resúmenes generados por IA.</p>
      </div>
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3 py-2 text-sm text-card-foreground">
        <i className={cn(
          'size-2 rounded-full',
          status === 'En directo' ? 'bg-emerald-500' : 'bg-amber-500',
        )} />
        {status}
      </span>
    </header>
    <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="mb-2 flex justify-between text-lg font-semibold">
        Últimos artículos
        <span className="text-muted-foreground">{articles.length}</span>
      </h2>
      {articles.length === 0 ? (
        <p className="py-6 text-muted-foreground">
          Aún no hay artículos. El worker los recogerá desde los feeds activos.
        </p>
      ) : articles.map(a => <article className="border-t py-5 first:mt-4" key={a.id}>
          <h3 className="mb-2 text-[17px] font-semibold">
            <a className="transition-colors hover:text-primary" href={a.url} target="_blank" rel="noreferrer">
              #{a.id} {a.title}
            </a>            
            {a.extra && a.extra.categories && a.extra.categories.length > 0 && (
              <>
                <span className='text-muted-foreground bg-muted text-xs rounded-md border px-1 py-1 italic ml-2'>
                  { a.extra.sentiment } - { a.extra.confidence }
                </span>
                <span className='text-muted-foreground bg-muted text-xs rounded-md border px-1 py-1 italic ml-2'>
                  { a.extra.categories.join(', ')}
                </span>
              </>
            )}
            <span className='text-muted-foreground bg-muted text-xs rounded-md border px-1 py-1 italic ml-2'>Resumen generado por IA.</span>     
          </h3>
          {a.summary && (
            <p className="mb-3 leading-relaxed text-muted-foreground whitespace-pre-line">{a.summary}</p>
          )}
          <small className="text-muted-foreground">
            {a.author || 'Autor desconocido'} · {a.published_at ? new Date(a.published_at).toLocaleString() : 'Fecha no disponible'}
          </small>
        </article>)}
    </section>
  </main>;
}
