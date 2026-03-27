import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Repeat, Settings, Copy, Check, Terminal, Info, AlertCircle, Save, Database, ArrowRight } from 'lucide-react';

const KkSchedulerJobEditorPlugin = {
    id: 'kk-scheduler-job-editor',
    name: 'KK Scheduler Job Editor',
    icon: <Calendar size={16} />,
    component: () => {
        const [jobData, setJobData] = useState({
            jobName: 'MY_NEW_REPORT_JOB',
            jobType: 'STORED_PROCEDURE',
            storedProc: 'PR_REPORT_GENERATOR',
            startDate: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            isRepeat: true,
            repeatInterval: '1',
            repeatUnit: 'DAY', // MINUTE, HOUR, DAY, WEEK, MONTH
            endDate: '',
            arguments: '',
            description: 'Daily report generation job'
        });

        const [sqlResult, setSqlResult] = useState('');
        const [copied, setCopied] = useState(false);

        const generateOracleSql = () => {
            const { jobName, jobType, storedProc, startDate, startTime, isRepeat, repeatInterval, repeatUnit } = jobData;

            let frequency = '';
            switch (repeatUnit) {
                case 'MINUTE': frequency = `FREQ=MINUTELY;INTERVAL=${repeatInterval}`; break;
                case 'HOUR': frequency = `FREQ=HOURLY;INTERVAL=${repeatInterval}`; break;
                case 'DAY': frequency = `FREQ=DAILY;INTERVAL=${repeatInterval}`; break;
                case 'WEEK': frequency = `FREQ=WEEKLY;INTERVAL=${repeatInterval}`; break;
                case 'MONTH': frequency = `FREQ=MONTHLY;INTERVAL=${repeatInterval}`; break;
                default: frequency = 'FREQ=DAILY;INTERVAL=1';
            }

            const startTimestamp = `${startDate} ${startTime}:00`;

            let sql = `BEGIN\n`;
            sql += `  DBMS_SCHEDULER.CREATE_JOB (\n`;
            sql += `    job_name        => '${jobName}',\n`;
            sql += `    job_type        => '${jobType}',\n`;
            sql += `    job_action      => '${storedProc}',\n`;
            sql += `    start_date      => TO_TIMESTAMP_TZ('${startTimestamp}', 'YYYY-MM-DD HH24:MI:SS'),\n`;

            if (isRepeat) {
                sql += `    repeat_interval => '${frequency}',\n`;
            }

            sql += `    enabled         => TRUE,\n`;
            sql += `    comments        => '${jobData.description}'\n`;
            sql += `  );\n`;
            sql += `END;`;

            setSqlResult(sql);
        };

        useEffect(() => {
            generateOracleSql();
        }, [jobData]);

        const handleCopy = () => {
            navigator.clipboard.writeText(sqlResult).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };

        const inputStyle = {
            width: '100%',
            padding: '0.7rem',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.85rem'
        };

        const labelStyle = {
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '0.4rem',
            fontWeight: '600',
            textTransform: 'uppercase'
        };

        return (
            <div className="plugin-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={22} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0 }}>KK Scheduler Job Editor</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Oracle DBMS_SCHEDULER tabanlı otomatik görev tanımlayıcı.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 450px) 1fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>

                    {/* Settings Panel */}
                    <div className="glass-card" style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.8rem' }}>
                            <Settings size={16} color="#f59e0b" />
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>JOB AYARLARI</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Job Adı</label>
                                <input style={inputStyle} value={jobData.jobName} onChange={e => setJobData({ ...jobData, jobName: e.target.value })} placeholder="Örn: NIGHTLY_SYNC_JOB" />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Stored Procedure / Action</label>
                                <input style={inputStyle} value={jobData.storedProc} onChange={e => setJobData({ ...jobData, storedProc: e.target.value })} placeholder="Örn: PR_SYNC_DATA" />
                            </div>

                            <div>
                                <label style={labelStyle}>Başlangıç Tarihi</label>
                                <input type="date" style={inputStyle} value={jobData.startDate} onChange={e => setJobData({ ...jobData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Başlangıç Saati</label>
                                <input type="time" style={inputStyle} value={jobData.startTime} onChange={e => setJobData({ ...jobData, startTime: e.target.value })} />
                            </div>

                            <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Repeat size={14} color="#f59e0b" />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tekrar Etme</span>
                                    </div>
                                    <label className="switch" style={{ width: '40px', height: '20px' }}>
                                        <input type="checkbox" checked={jobData.isRepeat} onChange={e => setJobData({ ...jobData, isRepeat: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: jobData.isRepeat ? '#f59e0b' : '#333', transition: '.4s', borderRadius: '34px' }}>
                                            <span style={{ position: 'absolute', height: '16px', width: '16px', left: jobData.isRepeat ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                        </span>
                                    </label>
                                </div>

                                {jobData.isRepeat && (
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ ...labelStyle, fontSize: '0.65rem' }}>Her</label>
                                            <input type="number" style={inputStyle} value={jobData.repeatInterval} shadow="none" onChange={e => setJobData({ ...jobData, repeatInterval: e.target.value })} />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <select style={inputStyle} value={jobData.repeatUnit} onChange={e => setJobData({ ...jobData, repeatUnit: e.target.value })}>
                                                <option value="MINUTE">Dakikada Bir</option>
                                                <option value="HOUR">Saatte Bir</option>
                                                <option value="DAY">Günde Bir</option>
                                                <option value="WEEK">Haftada Bir</option>
                                                <option value="MONTH">Ayda Bir</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Açıklama (Comment)</label>
                                <textarea style={{ ...inputStyle, height: '60px', resize: 'none' }} value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* SQL Preview Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Terminal size={16} color="#f59e0b" />
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>ÜRETİLEN ORACLE SQL</span>
                                </div>
                                <button className="btn" onClick={handleCopy} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.5rem', background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#fff' }}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kopyala'}
                                </button>
                            </div>
                            <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.3)', overflow: 'auto' }}>
                                <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', color: '#fcd34d', fontSize: '13px', lineHeight: '1.6' }}>
                                    {sqlResult}
                                </pre>
                            </div>
                        </div>

                        {/* Quick Action Hints */}
                        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Info size={16} color="#f59e0b" />
                                <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '500' }}>
                                    DBMS_SCHEDULER ayarlarını sol panelden değiştirdiğinizde SQL otomatik güncellenir.
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
};

export default KkSchedulerJobEditorPlugin;
