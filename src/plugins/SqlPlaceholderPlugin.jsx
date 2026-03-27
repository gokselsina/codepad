import React, { useState, useEffect, useRef } from 'react';
import { Database, Copy, Check, Terminal, RefreshCw, FileText, AlignLeft, Globe, History, Clock, ArrowRight, Search, Activity, Trash2 } from 'lucide-react';

const SqlPlaceholderPlugin = {
    id: 'sql-placeholder-fixer',
    name: 'KK V2 Rapor Sorgu Çevirici',
    icon: <Database size={16} />,
    component: () => {
        const [input, setInput] = useState('');
        const [result, setResult] = useState('');
        const [copied, setCopied] = useState(false);
        const [stats, setStats] = useState(null);
        const [url, setUrl] = useState('https://gui.kentkart.com.tr/portal');
        const [history, setHistory] = useState([]);
        const [isAutoInterceptActive, setIsAutoInterceptActive] = useState(true);
        const iframeRef = useRef(null);

        // SQL Formatting logic
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
                let json;
                if (typeof data === 'string') {
                    json = JSON.parse(data);
                } else {
                    json = data;
                }

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
                const newStats = {
                    paramCount: Object.keys(params).length,
                    replacedCount: replacedCount,
                    charLength: formatted.length,
                    timestamp: new Date(),
                    source: sourceInfo
                };

                const historyItem = {
                    id: Date.now(),
                    sql: formatted,
                    stats: newStats,
                    originalJson: json
                };

                setHistory(prev => [historyItem, ...prev].slice(0, 50));
                setResult(formatted);
                setStats(newStats);
                return formatted;
            } catch (e) {
                console.error('SQL işleme hatası:', e);
                return null;
            }
        };

        // Auto-intercept mechanism (simulated for demonstration within iframe constraints)
        // Note: REAL browser network interception requires a true browser extension.
        // Here we simulate the result capture that would happen if the user pastes the debug=1 response.
        useEffect(() => {
            const handleMessage = (event) => {
                // In a real environment, we would listen to messages from a content script
                // or a proxy that intercepts the network traffic.
                if (event.data && event.data.type === 'SQL_DATA_INTERCEPTED') {
                    processSqlData(event.data.payload, 'Otomatik Yakalama');
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }, []);

        const getTimeAgo = (date) => {
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return `${seconds} sn önce`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes} dk önce`;
            const hours = Math.floor(minutes / 60);
            return `${hours} sa önce`;
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

                {/* Top Navigation / Browser Bar */}
                <div className="glass-card" style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
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
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Git</button>
                    </div>
                    <div style={{ height: '24px', width: '1px', background: 'var(--card-border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={16} color={isAutoInterceptActive ? "#4ade80" : "#ef4444"} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>DEBUG=1 Intercept</span>
                        <label className="switch" style={{ width: '32px', height: '18px', position: 'relative', display: 'inline-block' }}>
                            <input
                                type="checkbox"
                                checked={isAutoInterceptActive}
                                onChange={() => setIsAutoInterceptActive(!isAutoInterceptActive)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isAutoInterceptActive ? 'var(--accent-color)' : '#444', transition: '.4s', borderRadius: '34px' }}>
                                <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: isAutoInterceptActive ? '16px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', flex: 1, overflow: 'hidden' }}>

                    {/* Main Browser Interaction / Manual Entry Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>

                        {/* Simulation of Browser View */}
                        <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--card-border)', fontSize: '0.7rem', display: 'flex', gap: '1rem' }}>
                                <span style={{ opacity: 0.6 }}>Tab: Kentkart GUI Portal</span>
                                <span style={{ opacity: 0.3 }}>|</span>
                                <span style={{ color: 'var(--accent-color)' }}>Network Inspection Active</span>
                            </div>

                            {/* This would be the real portal if CORS allowed, otherwise a simulation or manual box */}
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
                                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                                    <Globe size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        Burada normalde Kentkart GUI (Portal) ekranı yüklüdür. Güvenlik ve CORS kısıtlamaları nedeniyle iframe içinde portal her zaman yüklenmeyebilir.
                                    </p>
                                </div>

                                {/* Manual Intercept Simulation / Trigger */}
                                <div className="glass-card" style={{ width: '80%', padding: '1rem', borderStyle: 'dashed' }}>
                                    <p style={{ fontSize: '0.8rem', marginBottom: '0.8rem', fontWeight: '500' }}>DEBUG=1 ekleyip aldığınız JSON'u buraya yapıştırın:</p>
                                    <textarea
                                        className="input-field"
                                        style={{ width: '100%', height: '100px', fontSize: '11px', fontFamily: 'monospace' }}
                                        placeholder='{"sqlString": "...", "sqlParams": {...}}'
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                        onClick={() => processSqlData(input)}
                                    >
                                        Sorguyu Yakala & Çevir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Current Result Viewer */}
                        {result && (
                            <div className="glass-card animate-slide-up" style={{ height: '300px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <Activity size={14} className="animate-sparkle" color="var(--accent-color)" />
                                        <span style={{ fontWeight: '600' }}>Son Yakalanan Sorgu</span>
                                    </div>
                                    <button className="btn" onClick={() => handleCopy(result)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.4rem' }}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kopyala'}
                                    </button>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'auto', padding: '1rem' }}>
                                    <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: '12px', color: '#93c5fd', whiteSpace: 'pre' }}>
                                        {result}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: History */}
                    <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={16} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>İşlem Geçmişi</span>
                            </div>
                            <button
                                className="btn-icon"
                                onClick={() => setHistory([])}
                                title="Geçmişi Temizle"
                                style={{ opacity: history.length > 0 ? 1 : 0.3 }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                            {history.length === 0 ? (
                                <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.3 }}>
                                    <Clock size={32} style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.8rem' }}>Henüz geçmiş yok.</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="history-item animate-fade-in"
                                        onClick={() => {
                                            setResult(item.sql);
                                            setStats(item.stats);
                                        }}
                                        style={{
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            background: idx === 0 ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            border: idx === 0 ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
                                            marginBottom: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {getTimeAgo(item.stats.timestamp)}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '500' }}>
                                                {item.stats.replacedCount} yerleşim
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontFamily: 'monospace',
                                            color: '#ddd',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: '1.4'
                                        }}>
                                            {item.sql.substring(0, 150)}...
                                        </div>
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            <Activity size={10} /> {item.stats.source}
                                            <ArrowRight size={10} style={{ marginLeft: 'auto' }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
    }
};

export default SqlPlaceholderPlugin;
