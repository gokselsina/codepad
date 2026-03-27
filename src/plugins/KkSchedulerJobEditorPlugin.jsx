import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Settings, Copy, Check, Terminal, Info, Database, Layout, ArrowRight } from 'lucide-react';

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
            repeatMode: 'INTERVAL', // INTERVAL (Her X dk/saat), DAILY (Her gün şu saatte), WEEKLY
            repeatInterval: '10',
            repeatUnit: 'MINUTE',
            dailyTime: '03:00',
            description: 'Daily automated job'
        });

        const [sqlResult, setSqlResult] = useState('');
        const [copied, setCopied] = useState(false);

        const generateOracleSql = () => {
            const { jobName, jobType, storedProc, startDate, startTime, isRepeat, repeatMode, repeatInterval, repeatUnit, dailyTime } = jobData;

            let frequency = '';
            if (isRepeat) {
                if (repeatMode === 'INTERVAL') {
                    // Her X dakikada veya saatte bir
                    frequency = `FREQ=${repeatUnit === 'MINUTE' ? 'MINUTELY' : 'HOURLY'};INTERVAL=${repeatInterval}`;
                } else if (repeatMode === 'DAILY') {
                    // Her gün saat HH:mm de (BYHOUR, BYMINUTE)
                    const [h, m] = dailyTime.split(':');
                    frequency = `FREQ=DAILY;BYHOUR=${parseInt(h)};BYMINUTE=${parseInt(m)};BYSECOND=0`;
                } else if (repeatMode === 'WEEKLY') {
                    const [h, m] = dailyTime.split(':');
                    frequency = `FREQ=WEEKLY;BYHOUR=${parseInt(h)};BYMINUTE=${parseInt(m)};BYSECOND=0`;
                }
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
            outline: 'none'
        };

        const labelStyle = {
            display: 'block',
            fontSize: '0.7rem',
            color: 'rgba(245, 158, 11, 0.8)',
            marginBottom: '0.4rem',
            fontWeight: '700',
            textTransform: 'uppercase'
        };

        const tabButtonStyle = (active) => ({
            flex: 1,
            padding: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            borderRadius: '6px',
            border: '1px solid',
            background: active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            borderColor: active ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
            color: active ? '#fcd34d' : '#888',
            transition: 'all 0.2s'
        });

        return (
            <div className="plugin-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.05)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={22} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0, textTransform: 'uppercase' }}>KK Scheduler Job Studio</h2>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Gelişmiş DBMS_SCHEDULER zamanlama yapılandırıcısı.</p>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '1.2rem', flex: 1, overflow: 'hidden' }}>

                    {/* LeftSidebar: Settings */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.1)', overflowY: 'auto' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Settings size={16} color="#f59e0b" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fcd34d' }}>KONFİGÜRASYON</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={labelStyle}>Job Name</label>
                                <input style={inputStyle} value={jobData.jobName} onChange={e => setJobData({ ...jobData, jobName: e.target.value })} />
                            </div>

                            <div>
                                <label style={labelStyle}>Stored Proc Name</label>
                                <input style={inputStyle} value={jobData.storedProc} onChange={e => setJobData({ ...jobData, storedProc: e.target.value })} />
                            </div>

                            {/* Advanced Timing Container */}
                            <div style={{ padding: '1.2rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Repeat size={15} color="#fcd34d" />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>Zamanlama Modu</span>
                                    </div>
                                    <button
                                        onClick={() => setJobData({ ...jobData, isRepeat: !jobData.isRepeat })}
                                        style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', border: 'none', background: jobData.isRepeat ? '#f59e0b' : '#333', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
                                    >
                                        {jobData.isRepeat ? 'TEKRARLI' : 'TEK SEFERLİK'}
                                    </button>
                                </div>

                                {jobData.isRepeat && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                        {/* Mode Tabs */}
                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px' }}>
                                            <div onClick={() => setJobData({ ...jobData, repeatMode: 'INTERVAL' })} style={tabButtonStyle(jobData.repeatMode === 'INTERVAL')}>PERİYODİK</div>
                                            <div onClick={() => setJobData({ ...jobData, repeatMode: 'DAILY' })} style={tabButtonStyle(jobData.repeatMode === 'DAILY')}>GÜNLÜK</div>
                                            <div onClick={() => setJobData({ ...jobData, repeatMode: 'WEEKLY' })} style={tabButtonStyle(jobData.repeatMode === 'WEEKLY')}>HAFTALIK</div>
                                        </div>

                                        {/* Mode Specific Settings */}
                                        {jobData.repeatMode === 'INTERVAL' ? (
                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end', animation: 'slideDown 0.2s ease-out' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ ...labelStyle, fontSize: '0.6rem' }}>Her</label>
                                                    <input type="number" style={inputStyle} value={jobData.repeatInterval} onChange={e => setJobData({ ...jobData, repeatInterval: e.target.value })} />
                                                </div>
                                                <div style={{ flex: 2 }}>
                                                    <select style={inputStyle} value={jobData.repeatUnit} onChange={e => setJobData({ ...jobData, repeatUnit: e.target.value })}>
                                                        <option value="MINUTE">Dakikada Bir</option>
                                                        <option value="HOUR">Saatte Bir</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ animation: 'slideDown 0.2s ease-out' }}>
                                                <label style={{ ...labelStyle, fontSize: '0.6rem' }}>Her gün şu saatte başlasın:</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <input type="time" style={{ ...inputStyle, flex: 1 }} value={jobData.dailyTime} onChange={e => setJobData({ ...jobData, dailyTime: e.target.value })} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fcd34d', fontSize: '0.75rem' }}>
                                                        <ArrowRight size={14} /> 03:00 gibi
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>Start Date & Initial Time</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.8rem' }}>
                                    <input type="date" style={inputStyle} value={jobData.startDate} onChange={e => setJobData({ ...jobData, startDate: e.target.value })} />
                                    <input type="time" style={inputStyle} value={jobData.startTime} onChange={e => setJobData({ ...jobData, startTime: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'none' }} value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Result */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Terminal size={18} color="#f59e0b" />
                                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em' }}>DBMS_SCHEDULER SQL</span>
                                </div>
                                <button className="btn" onClick={handleCopy} style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', gap: '0.5rem', background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245,158,11,0.15)', color: copied ? '#4ade80' : '#fcd34d', border: '1px solid', borderColor: copied ? '#4ade80' : '#f59e0b' }}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'KOPYALANDI' : 'SQL KOPYALA'}
                                </button>
                            </div>

                            <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
                                <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', color: '#fcd34d', fontSize: '13px', lineHeight: '1.8' }}>
                                    {sqlResult}
                                </pre>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Info size={18} color="#f59e0b" />
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                <strong>Zamanlama İpucu:</strong> Günlük mod seçildiğinde Oracle arkaplanda <span style={{ color: '#fcd34d' }}>BYHOUR</span> ve <span style={{ color: '#fcd34d' }}>BYMINUTE</span> parametrelerini kullanarak her gün tam saatinde çalışmayı garanti eder.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
};

export default KkSchedulerJobEditorPlugin;
