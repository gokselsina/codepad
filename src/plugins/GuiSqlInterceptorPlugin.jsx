import React, { useState } from 'react';
import { Globe, Database, Copy, Check, Terminal, RefreshCw, History, Clock, ArrowRight, Activity, Trash2, Zap, Layout } from 'lucide-react';

const GuiSqlInterceptorPlugin = {
    id: 'gui-sql-interceptor',
    name: 'KK GUI SQL Interceptor',
    icon: <Globe size={16} />,
    component: () => {
        const [history, setHistory] = useState([]);
        const [lastResult, setLastResult] = useState(null);
        const [copied, setCopied] = useState(false);
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

        const processSqlData = (data, sourceInfo = 'Portal Yakalama') => {
            try {
                let json = typeof data === 'string' ? JSON.parse(data) : data;
                let sql = json.sqlString || '';
                const params = json.sqlParams || {};

                if (!sql) {
                    alert('JSON içerisinde "sqlString" bulunamadı!');
                    return null;
                }

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

                const newItem = { id: Date.now(), sql: formatted, stats, originalJson: json };
                setHistory(prev => [newItem, ...prev].slice(0, 50));
                setLastResult(newItem);
                setManualInput(''); // Clear input after success
                return formatted;
            } catch (e) {
                console.error('SQL Error:', e);
                alert('Geçersiz JSON formatı! Lütfen Portal\'daki debug çıktısını doğru kopyaladığınızdan emin olun.');
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
            <div className="plugin-container animate-fade-in" style={{ padding: '1rem', width: '100%', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                {/* Header - Control Center */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-color), #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Globe size={24} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0 }}>KK GUI SQL Interceptor</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                <Activity size={12} color="#4ade80" />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hazır JSON Ayrıştırma & Geçmiş Modu</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                    </div>
                </div>

                {/* Main Split Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 340px', gap: '1.2rem', flex: 1, overflow: 'hidden' }}>

                    {/* Left Panel: Input & Output */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>

                        {/* Upper: Input Area */}
                        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderStyle: 'dashed', borderColor: 'var(--accent-color)', background: 'rgba(139, 92, 246, 0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    <Terminal size={16} /> PORTAL ÇIKTISI (JSON)
                                </div>
                            </div>
                            <textarea
                                className="input-field"
                                style={{
                                    width: '100%',
                                    height: '140px',
                                    fontFamily: '"Fira Code", monospace',
                                    fontSize: '12px',
                                    padding: '1rem',
                                    resize: 'none',
                                    borderRadius: '12px'
                                }}
                                placeholder='JSON içeriğini yapıştırın...'
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                        processSqlData(manualInput);
                                    }
                                }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => { if (manualInput) processSqlData(manualInput); }}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    fontSize: '0.9rem',
                                    gap: '0.6rem',
                                    opacity: manualInput ? 1 : 0.5,
                                    background: 'linear-gradient(to right, var(--accent-color), #4f46e5)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                <Zap size={18} /> Şimdi Çevir ve Sorguyu Çıkar
                            </button>
                        </div>

                        {/* Lower: Formatted Output Area */}
                        <div className="glass-card" style={{ flex: 1, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    <Database size={16} color="var(--accent-color)" />
                                    <span>SONUÇ SORGU</span>
                                </div>
                                {lastResult && (
                                    <button className="btn" onClick={() => handleCopy(lastResult.sql)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.4rem', background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#fff' }}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı!' : 'Kopyala'}
                                    </button>
                                )}
                            </div>

                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'auto', position: 'relative' }}>
                                {!lastResult ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.5 }}>
                                        <Layout size={48} style={{ marginBottom: '1rem' }} />
                                        <p style={{ fontSize: '0.9rem' }}>Henüz bir sorgu yakalanmadı.</p>
                                    </div>
                                ) : (
                                    <pre style={{ margin: 0, padding: '1.5rem', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.7', color: '#93c5fd', whiteSpace: 'pre' }}>
                                        {lastResult.sql}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Activity History */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: '700' }}>
                                <History size={18} /> GEÇMİŞ
                            </div>
                            <button className="btn-icon" onClick={() => setHistory([])} style={{ color: 'var(--danger-color)' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem' }}>
                            {history.map((item, idx) => (
                                <div
                                    key={item.id}
                                    onClick={() => { setLastResult(item); setCopied(false); }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        background: item.id === lastResult?.id ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        marginBottom: '0.8rem',
                                        border: item.id === lastResult?.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={10} /> {getTimeAgo(item.stats.timestamp)}</span>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => { e.stopPropagation(); handleCopy(item.sql); }}
                                                style={{ padding: '2px', opacity: 0.6 }}
                                                title="Hızlı Kopyala"
                                            >
                                                <Copy size={12} />
                                            </button>
                                            <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{item.stats.replacedCount} P.</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#eee', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: '1.5' }}>
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
