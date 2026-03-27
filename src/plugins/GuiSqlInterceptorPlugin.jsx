import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Copy, Check, Terminal, RefreshCw, History, Clock, ArrowRight, Search, Activity, Trash2 } from 'lucide-react';

const GuiSqlInterceptorPlugin = {
    id: 'gui-sql-interceptor',
    name: 'KK GUI SQL Interceptor',
    icon: <Globe size={16} />,
    component: () => {
        const [url, setUrl] = useState('https://gui.kentkart.com.tr/portal');
        const [history, setHistory] = useState([]);
        const [lastResult, setLastResult] = useState(null);
        const [copied, setCopied] = useState(false);
        const [isAutoInterceptActive, setIsAutoInterceptActive] = useState(true);
        const [manualInput, setManualInput] = useState('');

        const formatSql = (sql) => {
            return sql
                .replace(/\s+/g, ' ')
                .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|FETCH|NEXT|ROWS|ONLY|INSERT|UPDATE|DELETE|SET|VALUES)\b/gi, '\n$1')
                .replace(/\b(AND|OR)\b/gi, '\n  $1')
                .replace(/,/g, ',\n ')
                .replace(/\(\s+/g, '(')
                .replace(/\s+\)/g, ')')
                .trim();
        };

        const processSqlData = (data, sourceInfo = 'Manuel Giriş') => {
            try {
                let json = typeof data === 'string' ? JSON.parse(data) : data;
                let sql = json.sqlString || '';
                const params = json.sqlParams || {};

                if (!sql) return null;

                let replacedCount = 0;
                const paramKeys = Object.keys(params).sort((a, b) => b.length - a.length);

                paramKeys.forEach(key => {
                    const val = params[key];
                    let replacement;
                    if (val === null) replacement = 'NULL';
                    else if (typeof val === 'string') replacement = `'${val}'`;
                    else replacement = val;

                    const regex = new RegExp(`:${key}\\b`, 'gi');
                    const matches = sql.match(regex);
                    if (matches) {
                        replacedCount += matches.length;
                        sql = sql.replace(regex, replacement);
                    }
                });

                const formatted = formatSql(sql);
                const stats = {
                    paramCount: Object.keys(params).length,
                    replacedCount: replacedCount,
                    timestamp: new Date(),
                    source: sourceInfo
                };

                const newItem = { id: Date.now(), sql: formatted, stats };
                setHistory(prev => [newItem, ...prev].slice(0, 50));
                setLastResult(newItem);
                return formatted;
            } catch (e) {
                console.error('SQL Error:', e);
                return null;
            }
        };

        const getTimeAgo = (date) => {
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return `${seconds} sn önce`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes} dk önce`;
            return `${Math.floor(minutes / 60)} sa önce`;
        };

        const handleCopy = (text) => {
            const copyToClipboard = (txt) => {
                if (navigator.clipboard && window.isSecureContext) {
                    return navigator.clipboard.writeText(txt);
                } else {
                    let textArea = document.createElement("textarea");
                    textArea.value = txt;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    textArea.style.top = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    return new Promise((res, rej) => {
                        document.execCommand('copy') ? res() : rej();
                        textArea.remove();
                    });
                }
            };

            copyToClipboard(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };

        return (
            <div className="plugin-container animate-fade-in" style={{ padding: '1rem', width: '100%', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Browser Bar */}
                <div className="glass-card" style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Globe size={18} color="var(--accent-color)" />
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={16} color={isAutoInterceptActive ? "#4ade80" : "#ef4444"} />
                        <span style={{ fontSize: '0.75rem' }}>DEBUG=1 Intercept</span>
                        <label className="switch" style={{ width: '32px', height: '18px', position: 'relative', display: 'inline-block' }}>
                            <input type="checkbox" checked={isAutoInterceptActive} onChange={() => setIsAutoInterceptActive(!isAutoInterceptActive)} style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isAutoInterceptActive ? 'var(--accent-color)' : '#444', transition: '.4s', borderRadius: '34px' }}>
                                <span style={{ position: 'absolute', height: '14px', width: '14px', left: isAutoInterceptActive ? '16px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', flex: 1, overflow: 'hidden' }}>

                    {/* Browser / Work Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                        <div style={{ flex: 1, background: '#111', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                            <iframe
                                src={url}
                                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                title="Kentkart GUI"
                            />

                            {/* Floating manual input for convenience */}
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div className="glass-card" style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--accent-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-color)' }}>DEBUG=1 JSON Yakala</span>
                                        <button className="btn-icon" onClick={() => setManualInput('')} style={{ padding: '2px' }}><RefreshCw size={12} /></button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <textarea
                                            className="input-field"
                                            style={{ flex: 1, height: '40px', fontFamily: 'monospace', fontSize: '10px', background: 'rgba(255,255,255,0.05)' }}
                                            placeholder='JSON verisini buraya yapıştırın...'
                                            value={manualInput}
                                            onChange={(e) => setManualInput(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0 1rem', fontSize: '0.75rem' }}
                                            onClick={() => { if (manualInput) { processSqlData(manualInput); setManualInput(''); } }}
                                        >
                                            Çevir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {lastResult && (
                            <div className="glass-card animate-slide-up" style={{ height: '250px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Sonuç Sorgu</span>
                                    <button className="btn" onClick={() => handleCopy(lastResult.sql)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                                        {copied ? <Check size={12} /> : <Copy size={12} />} Kopyala
                                    </button>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'auto', padding: '0.8rem' }}>
                                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#93c5fd', whiteSpace: 'pre' }}>{lastResult.sql}</pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History Sidebar */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                <History size={16} /> Geçmiş
                            </div>
                            <button className="btn-icon" onClick={() => setHistory([])}><Trash2 size={14} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                            {history.map((item, idx) => (
                                <div key={item.id} onClick={() => setLastResult(item)} style={{ padding: '0.7rem', borderRadius: '6px', background: item.id === lastResult?.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent', cursor: 'pointer', marginBottom: '0.4rem', border: '1px solid transparent' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                        <span>{getTimeAgo(item.stats.timestamp)}</span>
                                        <span style={{ color: 'var(--accent-color)' }}>{item.stats.replacedCount} p.</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {item.sql}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default GuiSqlInterceptorPlugin;
