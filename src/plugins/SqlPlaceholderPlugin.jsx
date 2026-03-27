import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, X, RefreshCw } from 'lucide-react';

const SqlPlaceholderPlugin = {
    id: 'sql-placeholder-fixer',
    name: 'SQL Parametre Birleştirici',
    icon: <Database size={16} />,
    component: () => {
        const [input, setInput] = useState('');
        const [result, setResult] = useState('');
        const [copied, setCopied] = useState(false);
        const [stats, setStats] = useState(null);

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
                const paramKeys = Object.keys(params).sort((a, b) => b.length - a.length); // Longest first to avoid partial matches

                paramKeys.forEach(key => {
                    const val = params[key];
                    let replacement;

                    if (val === null) {
                        replacement = 'NULL';
                    } else if (typeof val === 'string') {
                        // Check if it's already a date/number format or needs quotes
                        replacement = `'${val}'`;
                    } else {
                        replacement = val;
                    }

                    // Case insensitive regex for :paramName
                    const regex = new RegExp(`:${key}\\b`, 'gi');
                    const matches = sql.match(regex);
                    if (matches) {
                        replacedCount += matches.length;
                        sql = sql.replace(regex, replacement);
                    }
                });

                // Basic SQL highlight/cleanup (optional - just to make it look a bit better)
                // For simplicity, we'll just trim and keep formatting
                setResult(sql.trim());
                setStats({
                    paramCount: Object.keys(params).length,
                    replacedCount: replacedCount,
                    charLength: sql.length
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
            <div className="plugin-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Database className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff' }}>SQL Parametre Birleştirici</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>JSON içindeki :parametre değerlerini SQL ile harmanlar.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-icon" onClick={clearAll} title="Temizle">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Input Section */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Girdi (JSON Formatı)</label>
                            <textarea
                                placeholder='Örn: {"sqlString": "SELECT * FROM ...", "sqlParams": {...}}'
                                className="input-field"
                                style={{ width: '100%', height: '450px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)' }}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={processSql}
                                style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
                            >
                                <Terminal size={18} style={{ marginRight: '0.5rem' }} /> Birleştir ve Hazırla
                            </button>
                        </div>

                        {/* Output Section */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sonuç SQL</label>
                                {result && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(result);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                    >
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        {copied ? 'Kopyalandı' : 'Kopyala'}
                                    </button>
                                )}
                            </div>

                            <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                                {!result ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                        <Terminal size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ fontSize: '0.9rem' }}>Henüz çıktı yok.<br />Soldaki kutuya JSON verinizi girip butona basın.</p>
                                    </div>
                                ) : (
                                    <pre style={{ margin: 0, padding: '1rem', height: '100%', overflow: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', color: '#60a5fa', whiteSpace: 'pre-wrap' }}>
                                        {result}
                                    </pre>
                                )}
                            </div>

                            {stats && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div className="stat-badge" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Parametre Sayısı:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{stats.paramCount}</span>
                                    </div>
                                    <div className="stat-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Değiştirilen:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{stats.replacedCount}</span>
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
