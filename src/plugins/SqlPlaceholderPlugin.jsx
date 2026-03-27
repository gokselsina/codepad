import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, RefreshCw, FileText, AlignLeft } from 'lucide-react';

const SqlPlaceholderPlugin = {
    id: 'sql-placeholder-fixer',
    name: 'KK V2 Rapor Sorgu Çevirici',
    icon: <Database size={16} />,
    component: () => {
        const [input, setInput] = useState('');
        const [result, setResult] = useState('');
        const [copied, setCopied] = useState(false);
        const [stats, setStats] = useState(null);

        const formatSql = (sql) => {
            // Basic SQL formatter
            return sql
                .replace(/\s+/g, ' ')
                .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|FETCH|NEXT|ROWS|ONLY|INSERT|UPDATE|DELETE|SET|VALUES)\b/gi, '\n$1')
                .replace(/\b(AND|OR)\b/gi, '\n  $1')
                .replace(/,/g, ',\n ')
                .replace(/\(\s+/g, '(')
                .replace(/\s+\)/g, ')')
                .trim();
        };

        const processSql = () => {
            try {
                if (!input.trim()) return;

                const json = JSON.parse(input);
                let sql = json.sqlString || '';
                const params = json.sqlParams || {};

                if (!sql) {
                    alert('JSON içerisinde "sqlString" alanı bulunamadı!');
                    return;
                }

                let replacedCount = 0;
                const paramKeys = Object.keys(params).sort((a, b) => b.length - a.length);

                paramKeys.forEach(key => {
                    const val = params[key];
                    let replacement;

                    if (val === null) {
                        replacement = 'NULL';
                    } else if (typeof val === 'string') {
                        replacement = `'${val}'`;
                    } else {
                        replacement = val;
                    }

                    const regex = new RegExp(`:${key}\\b`, 'gi');
                    const matches = sql.match(regex);
                    if (matches) {
                        replacedCount += matches.length;
                        sql = sql.replace(regex, replacement);
                    }
                });

                // Apply formatting
                const formatted = formatSql(sql);
                setResult(formatted);

                setStats({
                    paramCount: Object.keys(params).length,
                    replacedCount: replacedCount,
                    charLength: formatted.length
                });
            } catch (e) {
                console.error(e);
                alert('Geçersiz JSON formatı! Lütfen geçerli bir JSON objesi yapıştırın.');
            }
        };

        const clearAll = () => {
            setInput('');
            setResult('');
            setStats(null);
        };

        return (
            <div className="plugin-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(67, 56, 202, 0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                <Database className="text-purple-400" size={22} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', margin: 0 }}>KK V2 Rapor Sorgu Çevirici</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>JSON verisini SQL sorgusu ile otomatik olarak harmanlar ve düzenler.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={clearAll} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}>
                                <RefreshCw size={14} /> Temizle
                            </button>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 450px) 1fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>

                        {/* Left: Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <FileText size={14} /> Girdi (JSON)
                            </div>
                            <textarea
                                placeholder='{"sqlString": "...", "sqlParams": {...}}'
                                className="input-field"
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    fontFamily: '"Fira Code", monospace',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                    background: 'rgba(0,0,0,0.25)',
                                    padding: '1rem',
                                    resize: 'none',
                                    borderRadius: '10px'
                                }}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={processSql}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    background: 'linear-gradient(to right, var(--accent-color), #4f46e5)',
                                    border: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                <Terminal size={18} style={{ marginRight: '0.6rem' }} /> İşle ve Formatla
                            </button>
                        </div>

                        {/* Right: Output */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <AlignLeft size={14} /> Çıktı (Harmanlanmış SQL)
                                </div>
                                {result && (
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            const copyToClipboard = (text) => {
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    return navigator.clipboard.writeText(text);
                                                } else {
                                                    // Fallback for non-secure contexts or older browsers
                                                    let textArea = document.createElement("textarea");
                                                    textArea.value = text;
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

                                            copyToClipboard(result).then(() => {
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }).catch(err => {
                                                console.error('Kopyalama hatası:', err);
                                                alert('Kopyalama başarısız oldu.');
                                            });
                                        }}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.75rem',
                                            gap: '0.4rem',
                                            background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: copied ? '#4ade80' : '#fff',
                                            border: `1px solid ${copied ? '#22c55e' : 'var(--card-border)'}`
                                        }}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Kopyalandı!' : 'Kopyala'}
                                    </button>
                                )}
                            </div>

                            <div style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.35)',
                                borderRadius: '10px',
                                border: '1px solid var(--card-border)',
                                overflow: 'auto',
                                position: 'relative',
                                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                {!result ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.5 }}>
                                        <Terminal size={40} style={{ marginBottom: '1rem' }} />
                                        <p style={{ fontSize: '0.85rem' }}>SQL çıktısı buraya gelecek.</p>
                                    </div>
                                ) : (
                                    <pre style={{
                                        margin: 0,
                                        padding: '1.2rem',
                                        fontFamily: '"Fira Code", monospace',
                                        fontSize: '13px',
                                        lineHeight: '1.7',
                                        color: '#93c5fd',
                                        whiteSpace: 'pre',
                                        tabSize: 2
                                    }}>
                                        {result}
                                    </pre>
                                )}
                            </div>

                            {stats && (
                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(139, 92, 246, 0.15)', color: 'rgba(167, 139, 250, 0.9)' }}>
                                        Parametre: <b>{stats.paramCount}</b>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(34, 197, 94, 0.15)', color: 'rgba(74, 222, 128, 0.9)' }}>
                                        Yerleşim: <b>{stats.replacedCount}</b>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid var(--card-border)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        Karakter: <b>{stats.charLength}</b>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default SqlPlaceholderPlugin;
