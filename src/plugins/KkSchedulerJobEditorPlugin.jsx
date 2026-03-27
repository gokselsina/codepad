import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Settings, Copy, Check, Terminal, Info, Database, Layout } from 'lucide-react';

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

        useEffect(() => { generateOracleSql(); }, [jobData]);

        const handleCopy = () => {
            navigator.clipboard.writeText(sqlResult).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };

        const inputStyle = {
            width: '100%',
            padding: '0.65rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'all 0.2s'
        };

        const labelStyle = {
            display: 'block',
            fontSize: '0.7rem',
            color: 'rgba(245, 158, 11, 0.8)',
            marginBottom: '0.4rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
        };

        return (
            <div className="plugin-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>

                {/* Header - Info & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.05)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
                        <Calendar size={22} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>KK Scheduler Job Creator</h2>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0.1rem 0 0 0' }}>DBMS_SCHEDULER işlerini görsel olarak yapılandırın.</p>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1.2rem', flex: 1, overflow: 'hidden' }}>

                    {/* Left Sidebar: Form Controls */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', border: '1px solid rgba(245, 158, 11, 0.1)', overflowY: 'auto' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Settings size={16} color="#f59e0b" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fcd34d' }}>KONFİGÜRASYON</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Job Name</label>
                                <input style={inputStyle} value={jobData.jobName} onChange={e => setJobData({ ...jobData, jobName: e.target.value })} placeholder="JOB_NAME" />
                            </div>

                            <div>
                                <label style={labelStyle}>Procedure / Action</label>
                                <input style={inputStyle} value={jobData.storedProc} onChange={e => setJobData({ ...jobData, storedProc: e.target.value })} placeholder="PR_NAME" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Start Date</label>
                                    <input type="date" style={inputStyle} value={jobData.startDate} onChange={e => setJobData({ ...jobData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Start Time</label>
                                    <input type="time" style={inputStyle} value={jobData.startTime} onChange={e => setJobData({ ...jobData, startTime: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Repeat size={15} color="#fcd34d" />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Tekrarlama (Repeat)</span>
                                    </div>
                                    {/* Clean UI Button Style Toggle instead of absolute floating elements */}
                                    <button
                                        onClick={() => setJobData({ ...jobData, isRepeat: !jobData.isRepeat })}
                                        style={{
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            background: jobData.isRepeat ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                                            borderColor: jobData.isRepeat ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                            color: jobData.isRepeat ? '#fcd34d' : '#999'
                                        }}
                                    >
                                        {jobData.isRepeat ? 'AKTİF' : 'PASİF'}
                                    </button>
                                </div>

                                {jobData.isRepeat && (
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ ...labelStyle, fontSize: '0.6rem' }}>Aralık</label>
                                            <input type="number" style={inputStyle} value={jobData.repeatInterval} onChange={e => setJobData({ ...jobData, repeatInterval: e.target.value })} />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <select style={inputStyle} value={jobData.repeatUnit} onChange={e => setJobData({ ...jobData, repeatUnit: e.target.value })}>
                                                <option value="MINUTE">Dakika</option>
                                                <option value="HOUR">Saat</option>
                                                <option value="DAY">Gün</option>
                                                <option value="WEEK">Hafta</option>
                                                <option value="MONTH">Ay</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>Description (Comment)</label>
                                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: SQL Result & Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>

                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', borderRadius: '20px' }}>
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Terminal size={18} color="#f59e0b" />
                                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em' }}>PREVIEW: DB_QUERY</span>
                                </div>
                                <button className="btn" onClick={handleCopy} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', gap: '0.5rem', background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245,158,11,0.1)', color: copied ? '#4ade80' : '#fcd34d', border: '1px solid', borderColor: copied ? '#4ade80' : 'rgba(245,158,11,0.3)' }}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'BAŞARIYLA KOPYALANDI' : 'TÜMÜNÜ KOPYALA'}
                                </button>
                            </div>

                            <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
                                <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', color: '#fcd34d', fontSize: '13px', lineHeight: '1.8' }}>
                                    {sqlResult}
                                </pre>
                            </div>
                        </div>

                        {/* Bottom Tip Panel */}
                        <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Info size={18} color="#f59e0b" />
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                <strong>Önemli Not:</strong> DBMS_SCHEDULER işleri varsayılan olarak <span style={{ color: '#fcd34d' }}>enabled => TRUE</span> olarak oluşturulur.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
};

export default KkSchedulerJobEditorPlugin;
