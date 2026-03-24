import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Copy, Plus, Trash2, Check, FileCode, FileType2, Edit3, Type, Code, LogOut, User, Share2, Search, X, Menu, ChevronLeft, Users, UserPlus, Sparkles, Palette, Wand2, Loader2 } from 'lucide-react';
import EditorModule from 'react-simple-code-editor';
const Editor = EditorModule.default || EditorModule;
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism-tomorrow.css';
import js_beautify from 'js-beautify';

import './App.css';

function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Kullanıcı adı ve şifre boş olamaz.');
      return;
    }

    try {
      const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        onLogin(username);
      } else {
        setError(data.error || 'Bir hata oluştu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Backend çalışıyor mu? (npm run dev)');
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1>Codepad</h1>
        </div>
        <div className="auth-tabs">
          <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Giriş Yap</div>
          <div className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Kayıt Ol</div>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>Şifre</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              {tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#58a6ff');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setColor(initialData?.color || '#58a6ff');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <h3>{initialData ? 'Kategoriyi Düzenle' : 'Yeni Kategori (Klasör) Ekle'}</h3>
        <div className="form-group">
          <label>Kategori İsmi</label>
          <input
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Kategori İsmi (Örn: Frontend)"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Renk</label>
          <input
            type="color"
            className="color-picker form-control"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={() => {
            if (name.trim()) {
              onSave({ name, color });
              onClose();
            }
          }}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ isOpen, onClose, note, updateNote, currentUser }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSharedWith(note?.sharedWith ? [...note.sharedWith] : []);
      setQuery('');
      setUsers([]);
    }
  }, [isOpen, note]);

  const searchUsers = async (q) => {
    setQuery(q);
    if (q.trim().length > 0) {
      try {
        const res = await fetch(`/api/users/search?q=${q}`);
        const data = await res.json();
        setUsers(data.users.filter(u => u !== currentUser && !sharedWith.includes(u)));
      } catch (err) {
        setUsers([]);
      }
    } else {
      setUsers([]);
    }
  };

  const handleAdd = (user) => {
    setSharedWith([...sharedWith, user]);
    setUsers(users.filter(u => u !== user));
  };

  const handleRemove = (user) => {
    setSharedWith(sharedWith.filter(u => u !== user));
  };

  const handleSave = () => {
    updateNote(note.id, 'sharedWith', sharedWith);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ width: '450px' }}>
        <h3>Notu Paylaş</h3>

        <div className="form-group" style={{ position: 'relative' }}>
          <label>Kullanıcı Ara</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 0.5rem' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              className="form-control"
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.75rem 0.5rem' }}
              value={query}
              onChange={e => searchUsers(e.target.value)}
              placeholder="Görmesini istediğin kullanıcının adını yaz..."
              autoFocus
            />
          </div>
          {users.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', marginTop: '0.5rem', zIndex: 10, overflow: 'hidden' }}>
              {users.map(u => (
                <div
                  key={u}
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => handleAdd(u)}
                >
                  <User size={14} style={{ marginRight: '0.5rem' }} /> {u}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label>Şu Kişilerle Paylaşılıyor:</label>
          {sharedWith.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Kimseyle paylaşılmıyor...</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sharedWith.map(u => (
                <div key={u} style={{ background: 'rgba(88, 166, 255, 0.1)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {u}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemove(u)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, updateNote, deleteNote, currentUser, workspace, isForcedParty, aiModel }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeAiBlockId, setActiveAiBlockId] = useState(null);
  const blocks = note.blocks || [];
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(false);
  const [confirmDeleteBlockId, setConfirmDeleteBlockId] = useState(null);
  const [isPartyMode, setIsPartyMode] = useState(isForcedParty || workspace.type === 'team');
  const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: { username, color, blockId, offset } }

  const socketRef = useRef(null);
  const isReadOnly = !!note.isShared;

  // Helper to calculate X/Y for monospace editors
  const calculateCursorPos = (content, offset, isCode) => {
    const lines = content.slice(0, offset).split('\n');
    const row = lines.length - 1;
    const col = lines[row].length;
    const lineHeight = isCode ? 21 : 26; // Approx heights
    const charWidth = isCode ? 8.4 : 9.5; // Approx widths
    const paddingLeft = isCode ? 68 : 8; // Margin + padding offsets
    const paddingTop = isCode ? 60 : 8; // Header + padding offsets

    return {
      top: row * lineHeight + paddingTop,
      left: col * charWidth + paddingLeft
    };
  };

  useEffect(() => {
    if (isPartyMode && workspace.type === 'team') {
      socketRef.current = io(window.location.origin);
      socketRef.current.emit('joinNote', { username: currentUser, noteId: note.id });

      socketRef.current.on('blockUpdated', ({ blockId, content }) => {
        // Skip updating if we are currently editing it? 
        // For simplicity, we just update the blocks array via updateNote but without re-emitting
        const newBlocks = note.blocks.map(b => b.id === blockId ? { ...b, content } : b);
        updateNote(note.id, 'blocks', newBlocks, true); // Added 'true' to signal 'remote' update
      });

      socketRef.current.on('blocksUpdated', ({ blocks }) => {
        updateNote(note.id, 'blocks', blocks, true);
      });

      socketRef.current.on('cursorUpdated', ({ blockId, cursor, senderId }) => {
        setRemoteCursors(prev => ({ ...prev, [senderId]: { ...cursor, blockId } }));
      });

      socketRef.current.on('userLeft', ({ sessionId }) => {
        setRemoteCursors(prev => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
      });

      return () => {
        socketRef.current.disconnect();
      };
    } else {
      setRemoteCursors({});
    }
  }, [isPartyMode, note.id, workspace.type]);

  const emitCursor = (blockId, offset) => {
    if (socketRef.current && isPartyMode) {
      socketRef.current.emit('cursorMove', {
        noteId: note.id,
        blockId,
        cursor: {
          offset,
          username: currentUser,
          color: getUserColor(currentUser)
        }
      });
    }
  };

  function getUserColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  }

  const addBlock = (index, type) => {
    if (isReadOnly) return;
    const newBlock = { id: Date.now().toString() + Math.random(), type, content: '' };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updateNote(note.id, 'blocks', newBlocks);

    if (isPartyMode && socketRef.current) {
      socketRef.current.emit('blocksChanged', { noteId: note.id, blocks: newBlocks, username: currentUser });
    }
  };

  const updateBlock = (blockId, content) => {
    if (isReadOnly) return;
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    updateNote(note.id, 'blocks', newBlocks);

    if (isPartyMode && socketRef.current) {
      socketRef.current.emit('editBlock', { noteId: note.id, blockId, content, username: currentUser });
    }
  };

  const removeBlock = (blockId) => {
    if (isReadOnly) return;
    const newBlocks = blocks.filter(b => b.id !== blockId);
    updateNote(note.id, 'blocks', newBlocks);

    if (isPartyMode && socketRef.current) {
      socketRef.current.emit('blocksChanged', { noteId: note.id, blocks: newBlocks, username: currentUser });
    }
  };

  const [copiedBlockId, setCopiedBlockId] = useState(null);

  const handleCopy = (blockId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 1000);
  };

  const handlePasteCode = (e, blockId, currentContent) => {
    if (isReadOnly) return;
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');

    let formattedText = pastedText;
    try {
      if (pastedText.trim().startsWith('<')) {
        formattedText = js_beautify.html(pastedText, { indent_size: 2 });
      } else if (pastedText.includes('{') && pastedText.includes(':') && pastedText.includes(';')) {
        formattedText = js_beautify.js(pastedText, { indent_size: 2 });
      } else {
        formattedText = js_beautify.js(pastedText, { indent_size: 2 });
      }
    } catch (err) { }

    const newVal = currentContent ? currentContent + "\n" + formattedText : formattedText;
    updateBlock(blockId, newVal);
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleAIAction = async (blockId, actionType) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !block.content.trim()) return;

    setAiLoading(true);
    setActiveAiBlockId(blockId);
    setAiResponse(null);

    let systemPrompt = '';
    let userPrompt = '';

    if (actionType === 'explain') {
      systemPrompt = "Sen tecrübeli bir yazılım geliştiricisin. Sana verilen kodu veya metni teknik detayları atlamadan fakat anlaşılır şekilde açıkla.";
      userPrompt = `Şu içeriği açıkla:\n\n${block.content}`;
    } else if (actionType === 'fix') {
      systemPrompt = "Sen bir hata avcısısın. Verilen koddaki hataları bul ve sadece düzeltilmiş haliyle birlikte kısa bir açıklama ver.";
      userPrompt = `Şu koddaki hataları düzelt:\n\n${block.content}`;
    } else if (actionType === 'improve') {
      systemPrompt = "Sen bir teknik yazar ve editörsün. Verilen metni veya kodu daha kaliteli, okunabilir ve profesyonel hale getir.";
      userPrompt = `Şu içeriği geliştir:\n\n${block.content}`;
    }

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, system: systemPrompt, model: aiModel })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResponse(data.response);
    } catch (err) {
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        note={note}
        updateNote={updateNote}
        currentUser={currentUser}
      />

      <div className="glass-card animate-fade-in note-editing-area">
        <div className="note-header-actions">
          <div style={{ flex: 1 }}>
            <input
              className="note-title-input"
              value={note.title || ''}
              onChange={(e) => updateNote(note.id, 'title', e.target.value)}
              placeholder="Not Adı (Örn: Fetch API Kullanımı)"
              readOnly={isReadOnly}
              style={{ color: isReadOnly ? 'var(--text-muted)' : '#fff' }}
            />
          </div>
          {!isReadOnly && !isForcedParty && (
            <button className="btn-icon" onClick={() => setIsShareModalOpen(true)} title="Paylaş" style={{ marginRight: '0.5rem' }}>
              <Share2 size={20} />
            </button>
          )}

          {isForcedParty && (
            <button
              className="btn btn-secondary"
              onClick={() => deleteNote(note.id)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <LogOut size={14} />
              Partiden Ayrıl
            </button>
          )}
          {!isReadOnly && (
            <button
              className="btn-icon btn-danger"
              style={confirmDeleteNote ? { background: 'var(--danger-color)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem' } : {}}
              onClick={() => {
                const hasContent = blocks.some(b => b.content && b.content.trim().length > 0);
                if (hasContent && !confirmDeleteNote) {
                  setConfirmDeleteNote(true);
                  setTimeout(() => setConfirmDeleteNote(false), 3000);
                } else {
                  deleteNote(note.id);
                }
              }}
              title="Notu Sil"
            >
              {confirmDeleteNote ? <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Emin misiniz?</span> : <Trash2 size={20} />}
            </button>
          )}
        </div>

        <div className="blocks-container">
          {!isReadOnly && blocks.length > 0 && (
            <div className="top-add-trigger">
              <div className="inline-add-container">
                <div className="inline-add-actions">
                  <button className="inline-add-btn" onClick={() => addBlock(-1, 'text')}><Type size={14} /> Metin</button>
                  <button className="inline-add-btn" onClick={() => addBlock(-1, 'code')}><Code size={14} /> Kod</button>
                </div>
              </div>
            </div>
          )}
          {blocks.map((block, index) => {
            const isAiActive = activeAiBlockId === block.id;
            if (block.type === 'text') {
              return (
                <div key={block.id} className="block-wrapper" style={{ paddingBottom: '0.5rem', position: 'relative' }}>
                  {Object.entries(remoteCursors).filter(([_, c]) => c.blockId === block.id).map(([sid, c]) => {
                    const pos = calculateCursorPos(block.content, c.offset, false);
                    return (
                      <div key={sid} className="remote-cursor" style={{
                        position: 'absolute',
                        left: `${pos.left}px`,
                        top: `${pos.top}px`,
                        height: '24px',
                        borderLeft: `2px solid ${c.color}`,
                        zIndex: 20
                      }}>
                        <div className="remote-cursor-label" style={{ backgroundColor: c.color }}>{c.username}</div>
                      </div>
                    );
                  })}
                  {!isReadOnly && (
                    <div className="block-actions">
                      <button className="block-btn" onClick={() => handleAIAction(block.id, 'explain')} title="Açıkla"><Wand2 size={14} /></button>
                      <button
                        className="block-btn block-btn-danger"
                        style={confirmDeleteBlockId === block.id ? { background: 'var(--danger-color)', color: '#fff', border: 'none' } : {}}
                        onClick={() => {
                          if (block.content && block.content.trim().length > 0 && confirmDeleteBlockId !== block.id) {
                            setConfirmDeleteBlockId(block.id);
                            setTimeout(() => setConfirmDeleteBlockId(null), 3000);
                          } else {
                            removeBlock(block.id);
                          }
                        }}
                        title="Sil"
                      >
                        {confirmDeleteBlockId === block.id ? <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Emin misiniz?</span> : <Trash2 size={14} />}
                      </button>
                    </div>
                  )}
                  <textarea
                    className="text-block-input"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    onInput={handleTextareaInput}
                    onKeyUp={(e) => emitCursor(block.id, e.target.selectionStart)}
                    onClick={(e) => emitCursor(block.id, e.target.selectionStart)}
                    placeholder={isReadOnly ? "" : "Metin ekleyin..."}
                    readOnly={isReadOnly}
                    rows={1}
                  />
                  {!isReadOnly && (
                    <div className="inline-add-container">
                      <div className="inline-add-actions">
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'text')}><Type size={14} /> Metin</button>
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'code')}><Code size={14} /> Kod</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else if (block.type === 'code') {
              return (
                <div key={block.id} className="block-wrapper" style={{ position: 'relative' }}>
                  {Object.entries(remoteCursors).filter(([_, c]) => c.blockId === block.id).map(([sid, c]) => {
                    const pos = calculateCursorPos(block.content, c.offset, true);
                    return (
                      <div key={sid} className="remote-cursor" style={{
                        position: 'absolute',
                        left: `${pos.left}px`,
                        top: `${pos.top}px`,
                        height: '20px',
                        borderLeft: `2px solid ${c.color}`,
                        zIndex: 20
                      }}>
                        <div className="remote-cursor-label" style={{ backgroundColor: c.color }}>{c.username}</div>
                      </div>
                    );
                  })}
                  <div className="code-wrapper">
                    <div className="code-header">
                      <span>Kod Bloğu</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.2)' }} onClick={() => handleAIAction(block.id, 'fix')}>
                          <Sparkles size={14} /> Düzelt
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }} onClick={() => handleAIAction(block.id, 'explain')}>
                          <Wand2 size={14} /> Açıkla
                        </button>
                        <button className={`btn ${copiedBlockId === block.id ? 'btn-success' : 'btn-primary'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => handleCopy(block.id, block.content)}>
                          {copiedBlockId === block.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedBlockId === block.id ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                        {!isReadOnly && (
                          <button
                            className="btn-icon btn-danger"
                            style={confirmDeleteBlockId === block.id ? { background: 'var(--danger-color)', color: '#fff', border: 'none', padding: '0.2rem 0.6rem' } : { padding: '0.2rem 0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                            onClick={() => {
                              if (block.content && block.content.trim().length > 0 && confirmDeleteBlockId !== block.id) {
                                setConfirmDeleteNote(false); // reset
                                setConfirmDeleteBlockId(block.id);
                                setTimeout(() => setConfirmDeleteBlockId(null), 3000);
                              } else {
                                removeBlock(block.id);
                              }
                            }}
                            title="Sil"
                          >
                            {confirmDeleteBlockId === block.id ? <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Emin misiniz?</span> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="code-editor-container">
                      <Editor
                        value={block.content}
                        onValueChange={(code) => updateBlock(block.id, code)}
                        onKeyUp={(e) => emitCursor(block.id, e.target.selectionStart)}
                        onClick={(e) => emitCursor(block.id, e.target.selectionStart)}
                        highlight={(code) => {
                          try { return Prism.highlight(code, Prism.languages.jsx || Prism.languages.javascript, 'jsx'); }
                          catch (e) { return code; }
                        }}
                        padding={16}
                        disabled={isReadOnly}
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 14,
                          minHeight: '100px',
                          backgroundColor: '#1e1e1e',
                          minWidth: '100%',
                          width: 'max-content',
                          opacity: isReadOnly ? 0.8 : 1
                        }}
                        textareaProps={{
                          onPaste: (e) => handlePasteCode(e, block.id, block.content),
                          placeholder: isReadOnly ? "" : "Kodu buraya yapıştırın, otomatik formatlanacaktır..."
                        }}
                      />
                    </div>
                  </div>
                  {!isReadOnly && (
                    <div className="inline-add-container">
                      <div className="inline-add-actions">
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'text')}><Type size={14} /> Metin</button>
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'code')}><Code size={14} /> Kod</button>
                      </div>
                    </div>
                  )}
                  {isAiActive && (aiLoading || aiResponse) && (
                    <div className="ai-response-area animate-fade-in" style={{
                      marginTop: '1rem',
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <div className="ai-response-header" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.1)', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Wand2 size={16} color="#c084fc" className={aiLoading ? 'animate-pulse' : ''} />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#c084fc' }}>AI Yardımcı</span>
                        </div>
                        <X size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => { setActiveAiBlockId(null); setAiResponse(null); }} />
                      </div>
                      <div className="ai-response-body" style={{ padding: '1rem' }}>
                        {aiLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Loader2 size={24} className="animate-spin" color="#c084fc" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Düşünüyorum...</span>
                          </div>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#e5e7eb', lineHeight: '1.6' }}>
                            {aiResponse}
                          </div>
                        )}
                      </div>
                      {!aiLoading && aiResponse && (
                        <div className="ai-response-footer" style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => {
                            if (block.type === 'text') {
                              updateBlock(block.id, block.content + "\n\n--- AI Önerisi ---\n" + aiResponse);
                            } else {
                              updateBlock(block.id, block.content + "\n\n/* AI Önerisi:\n" + aiResponse + "\n*/");
                            }
                            setActiveAiBlockId(null);
                            setAiResponse(null);
                          }}>Uygula/Ekle</button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isReadOnly && (
                    <div className="inline-add-container">
                      <div className="inline-add-actions">
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'text')}><Type size={14} /> Metin</button>
                        <button className="inline-add-btn" onClick={() => addBlock(index, 'code')}><Code size={14} /> Kod</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })}

          {!isReadOnly && blocks.length === 0 && (
            <div className="add-block-menu">
              <button className="add-block-btn" onClick={() => addBlock(-1, 'text')}>
                <Type size={16} /> Metin Ekle
              </button>
              <button className="add-block-btn" onClick={() => addBlock(-1, 'code')}>
                <Code size={16} /> Kod Bloğu
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Spotlight({ isOpen, onClose, folders, notes, teams, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const allNotes = notes.map(n => ({ ...n, spotlightType: 'note', meta: folders.find(f => f.id === n.folderId)?.name }));
    const allFolders = folders.map(f => ({ ...f, spotlightType: 'folder', meta: 'Klasör', title: f.name }));
    const allTeams = teams.map(t => ({ ...t, spotlightType: 'team', meta: 'Ekip', title: t.name }));

    const searchPool = [...allNotes, ...allFolders, ...allTeams];
    const filtered = searchPool.filter(item => {
      const q = query.toLowerCase();
      if (!q) return false;
      const titleMatch = (item.title || '').toLowerCase().includes(q);

      if (item.spotlightType === 'note') {
        const contentMatch = (item.blocks || []).some(b => (b.content || '').toLowerCase().includes(q));
        if (contentMatch && !titleMatch) {
          item.matchedInContent = true;
        }
        return titleMatch || contentMatch;
      }
      return titleMatch;
    }).slice(0, 10);

    setResults(filtered);
    setActiveIndex(0);
  }, [query, isOpen, notes, folders, teams]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      onSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-content" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="spotlight-input-wrapper">
          <Search size={22} color="var(--accent-color)" />
          <input
            className="spotlight-input"
            placeholder="Ne aramıştınız? (Not, Klasör, Ekip...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="spotlight-results">
          {results.map((item, idx) => (
            <div
              key={item.id}
              className={`spotlight-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {item.spotlightType === 'note' ? <FileCode size={18} /> : item.spotlightType === 'folder' ? <FileType2 size={18} /> : <Users size={18} />}
              <div className="spotlight-item-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="spotlight-item-title">{item.title || 'İsimsiz'}</span>
                  {item.matchedInContent && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', borderRadius: '4px' }}>İçerikte eşleşti</span>}
                </div>
                <span className="spotlight-item-meta">{item.meta || ''}</span>
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Eşleşen sonuç bulunamadı...</div>
          )}
        </div>
        <div className="spotlight-kbd-hint">
          <span className="kbd-pill">⏎ Seç</span>
          <span className="kbd-pill">↑↓ Gezin</span>
          <span className="kbd-pill">Esc Kapat</span>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ isOpen, onClose, currentTheme, onThemeChange }) {
  const themes = [
    { id: 'midnight', name: 'Midnight Premium', class: '', colors: ['#030712', '#112240', '#60a5fa'], stats: 'Varsayılan' },
    { id: 'termius-light', name: 'Termius Light', class: 'theme-termius-light', colors: ['#f3f4f6', '#ffffff', '#2563eb'], stats: '34561' },
    { id: 'hacker-green', name: 'Hacker Green', class: 'theme-hacker-green', colors: ['#050505', '#000000', '#22c55e'], stats: '10954' },
    { id: 'hacker-red', name: 'Hacker Red', class: 'theme-hacker-red', colors: ['#050505', '#000000', '#ef4444'], stats: '1091' },
    { id: 'kanagawa', name: 'Kanagawa Dragon', class: 'theme-kanagawa-dragon', colors: ['#181616', '#242222', '#c0a070'], stats: '13922' },
    { id: 'everforest', name: 'Everforest Dark', class: 'theme-everforest-dark', colors: ['#2d353b', '#2b3339', '#a7c080'], stats: '7695' },
  ];

  const [activeTab, setActiveTab] = useState('palette');

  return (
    <>
      <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h3>Ayarlar</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-tabs">
          <div className={`settings-tab-btn ${activeTab === 'rocket' ? 'active' : ''}`} onClick={() => setActiveTab('rocket')}><Sparkles size={20} /></div>
          <div className={`settings-tab-btn ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}><Code size={20} /></div>
          <div className={`settings-tab-btn ${activeTab === 'clock' ? 'active' : ''}`} onClick={() => setActiveTab('clock')}><Users size={20} /></div>
          <div className={`settings-tab-btn ${activeTab === 'palette' ? 'active' : ''}`} onClick={() => setActiveTab('palette')}><Palette size={20} /></div>
        </div>
        <div className="settings-content">
          {activeTab === 'palette' ? (
            <div className="settings-section">
              <h4>Temalar</h4>
              <div className="theme-list">
                {themes.map(t => (
                  <div
                    key={t.id}
                    className={`theme-item ${currentTheme === t.class ? 'active' : ''}`}
                    onClick={() => onThemeChange(t.class)}
                  >
                    <div className="theme-preview" style={{ backgroundColor: t.colors[0] }}>
                      <div className="p-row" style={{ backgroundColor: t.colors[2] }} />
                      <div className="p-row" style={{ backgroundColor: t.colors[1] }} />
                      <div className="p-row" style={{ backgroundColor: t.colors[2], opacity: 0.5 }} />
                    </div>
                    <div className="theme-info">
                      <span className="theme-name" style={{ color: t.id === 'termius-light' ? '#111827' : '#fff' }}>{t.name}</span>
                      <span className="theme-stats">{t.stats}</span>
                    </div>
                    {currentTheme === t.class && <Check size={16} color="var(--accent-color)" />}
                  </div>
                ))}
              </div>

              <h4 style={{ marginTop: '2rem' }}>Yapay Zeka (Ollama)</h4>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Kullanılacak Model</label>
                <input
                  className="form-control"
                  value={localStorage.getItem('codepad-ai-model') || 'codellama'}
                  onChange={(e) => {
                    localStorage.setItem('codepad-ai-model', e.target.value);
                    window.dispatchEvent(new Event('storage')); // trigger update if needed
                  }}
                  placeholder="örn: codellama, llama3, mistral"
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Ollama'da yüklü olan model adını yazın.</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Bu bölüm yakında eklenecek...
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MainApp({ currentUser, onLogout }) {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('codepad-theme') || '');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('codepad-ai-model') || 'codellama');

  useEffect(() => {
    const handleStorage = () => {
      setAiModel(localStorage.getItem('codepad-ai-model') || 'codellama');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    // Remove all possible theme classes
    const themeClasses = ['theme-termius-light', 'theme-hacker-green', 'theme-hacker-red', 'theme-kanagawa-dragon', 'theme-everforest-dark'];
    document.body.classList.remove(...themeClasses);
    if (currentTheme) {
      document.body.classList.add(currentTheme);
    }
    localStorage.setItem('codepad-theme', currentTheme);
  }, [currentTheme]);

  const [workspace, setWorkspace] = useState({ type: 'personal', id: currentUser });
  const [userTeams, setUserTeams] = useState([]);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [teamNameForm, setTeamNameForm] = useState('');
  const [teamMemberForm, setTeamMemberForm] = useState('');
  const [teamMemberSearchResults, setTeamMemberSearchResults] = useState([]);
  const [isPartyRoomActive, setIsPartyRoomActive] = useState(false);
  const [partyNote, setPartyNote] = useState(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKbd = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKbd);
    return () => window.removeEventListener('keydown', handleGlobalKbd);
  }, []);

  const handleSpotlightSelect = (item) => {
    setIsSpotlightOpen(false);
    if (item.spotlightType === 'note') {
      // If note is in a team, switch workspace
      if (item.team_id) {
        const team = userTeams.find(t => t.id === item.team_id);
        setWorkspace({ type: 'team', id: item.team_id, name: team?.name });
      } else {
        setWorkspace({ type: 'personal', id: currentUser });
      }
      setSelectedNoteId(item.id);
      setIsPartyRoomActive(false);
    } else if (item.spotlightType === 'team') {
      setWorkspace({ type: 'team', id: item.id, name: item.name });
      setSelectedNoteId(null);
      setIsPartyRoomActive(false);
    }
  };

  useEffect(() => {
    setIsPartyRoomActive(false);
    setPartyNote(null);
  }, [workspace.id]);

  const fetchPartyNote = () => {
    if (workspace.type !== 'team') return;
    fetch(`/api/teams/${workspace.id}/party-note`)
      .then(r => r.json())
      .then(note => {
        setPartyNote(note);
        setIsPartyRoomActive(true);
      });
  };

  const updatePartyNote = (id, field, value) => {
    setPartyNote(prev => ({ ...prev, [field]: value }));
    // Saving to server is handled by periodic saves or explicit post if needed?
    // Actually NoteCard handles socket emits. We just need to handle the DB save.
    fetch(`/api/teams/${workspace.id}/party-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: field === 'blocks' ? value : partyNote.blocks })
    });
  };

  useEffect(() => {
    if (!teamMemberForm.trim()) {
      setTeamMemberSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(teamMemberForm)}`)
        .then(res => res.json())
        .then(data => {
          const currentMembers = userTeams.find(t => t.id === workspace.id)?.members || [];
          setTeamMemberSearchResults((data.users || []).filter(u => !currentMembers.includes(u)));
        });
    }, 300);
    return () => clearTimeout(delay);
  }, [teamMemberForm, workspace.id, userTeams]);

  const fetchTeams = () => {
    fetch(`/api/teams/${currentUser}`).then(r => r.json()).then(data => setUserTeams(data));
  };

  useEffect(() => {
    fetchTeams();
  }, [currentUser]);

  const initialMount = useRef(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = workspace.type === 'personal' ? `/api/collection/${currentUser}` : `/api/teams/collection/${workspace.id}`;
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setFolders(data.folders || []);
        setNotes(data.notes || []);
        if (data.notes && data.notes.length > 0) {
          setSelectedNoteId(data.notes[0].id);
        } else {
          setSelectedNoteId(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Veri çekme hatası:", err);
        setLoading(false);
      });
  }, [currentUser, workspace]);

  useEffect(() => {
    if (loading) return;
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    const endpoint = workspace.type === 'personal' ? `/api/collection/${currentUser}` : `/api/teams/collection/${workspace.id}`;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders, notes })
    }).catch(e => console.error("Kayıt hatası:", e));
  }, [folders, notes, loading, workspace]);

  const handleSaveFolder = (data) => {
    if (editingFolderId) {
      setFolders(folders.map(f => f.id === editingFolderId ? { ...f, ...data } : f));
    } else {
      const isTeam = workspace.type === 'team';
      const folderPayload = { id: (isTeam ? 'tf_' : 'f_') + Date.now().toString(), ...data };
      if (isTeam) folderPayload.teamId = workspace.id;
      setFolders([...folders, folderPayload]);
    }
  };

  const deleteFolder = (id) => {
    if (id === 'f_shared') return; // Cannot delete virtual shared folder
    if (confirm('Kategoriyi silersen içindeki notlar da silinir. Onaylıyor musun?')) {
      const updatedNotes = notes.filter(n => n.folderId !== id);
      setNotes(updatedNotes);
      setFolders(folders.filter(f => f.id !== id));
      if (updatedNotes.length > 0) {
        setSelectedNoteId(updatedNotes[0].id);
      } else {
        setSelectedNoteId(null);
      }
    }
  };

  const addNote = (folderId) => {
    if (folderId === 'f_shared') return;
    const newNote = {
      id: Date.now().toString(),
      folderId,
      title: 'Yeni Not',
      blocks: [{ id: Date.now().toString() + 'b1', type: 'text', content: '' }],
      sharedWith: []
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  const updateNote = (id, field, value, isRemote = false) => {
    setNotes(notes.map(note => note.id === id ? { ...note, [field]: value } : note));
    if (isRemote) initialMount.current = false; // Just to be safe but usually we want to save
  };

  const updateNotePartyRoom = (id, field, value, isRemote = false) => {
    setPartyNote(prev => ({ ...prev, [field]: value }));
    if (!isRemote) {
      // Only save to DB if it's a local edit
      fetch(`/api/teams/${workspace.id}/party-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: field === 'blocks' ? value : partyNote.blocks })
      });
    }
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (selectedNoteId === id) setSelectedNoteId(updated.length > 0 ? updated[0].id : null);
  };

  const handleFolderDragStart = (e, folderId) => {
    if (folderId === 'f_shared') return;
    e.stopPropagation();
    e.dataTransfer.setData('type', 'folder');
    e.dataTransfer.setData('id', folderId);
    setDraggedItem({ id: folderId, type: 'folder' });
  };

  const handleNoteDragStart = (e, noteId) => {
    e.stopPropagation();
    e.dataTransfer.setData('type', 'note');
    e.dataTransfer.setData('id', noteId);
    setDraggedItem({ id: noteId, type: 'note' });
  };

  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (folderId === 'f_shared') return;

    if (draggedItem?.type === 'folder' && draggedItem.id !== folderId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isBottom = e.clientY > rect.top + rect.height / 2;
      setDragOverItem({ id: folderId, type: 'folder', isBottom });
    } else if (draggedItem?.type === 'note') {
      setDragOverItem({ id: folderId, type: 'folder', isBottom: true });
    }
  };

  const handleNoteDragOver = (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    const note = notes.find(n => n.id === noteId);
    if (note?.isShared) return;

    if (draggedItem?.type === 'note' && draggedItem.id !== noteId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isBottom = e.clientY > rect.top + rect.height / 2;
      setDragOverItem({ id: noteId, type: 'note', isBottom });
    }
  };

  const handleFolderDrop = (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetFolderId === 'f_shared') {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const type = e.dataTransfer.getData('type');
    const draggedId = e.dataTransfer.getData('id');

    if (type === 'folder' && draggedId && draggedId !== targetFolderId) {
      const draggedIndex = folders.findIndex(f => f.id === draggedId);
      const targetIndex = folders.findIndex(f => f.id === targetFolderId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFolders = [...folders];
        const [removed] = newFolders.splice(draggedIndex, 1);
        const newTargetIndex = newFolders.findIndex(f => f.id === targetFolderId);

        const isBottom = dragOverItem?.isBottom;
        const finalIndex = newTargetIndex >= 0 ? newTargetIndex : targetIndex;
        const insertIndex = isBottom ? finalIndex + 1 : finalIndex;

        newFolders.splice(insertIndex, 0, removed);
        setFolders(newFolders);
      }
    } else if (type === 'note') {
      const draggedIndex = notes.findIndex(n => n.id === draggedId);
      if (draggedIndex !== -1) {
        const draggedNote = notes[draggedIndex];
        if (!draggedNote.isShared && draggedNote.folderId !== targetFolderId) {
          const newNotes = [...notes];
          newNotes[draggedIndex] = { ...draggedNote, folderId: targetFolderId };
          const [removed] = newNotes.splice(draggedIndex, 1);
          newNotes.push(removed);
          setNotes(newNotes);
        }
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleNoteDrop = (e, targetNoteId) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    const draggedId = e.dataTransfer.getData('id');

    if (type === 'note' && draggedId && draggedId !== targetNoteId) {
      const draggedIndex = notes.findIndex(n => n.id === draggedId);
      const targetIndex = notes.findIndex(n => n.id === targetNoteId);
      const targetNote = notes.find(n => n.id === targetNoteId);

      if (draggedIndex !== -1 && targetIndex !== -1 && targetNote && !targetNote.isShared) {
        const newNotes = [...notes];
        const [removed] = newNotes.splice(draggedIndex, 1);
        removed.folderId = targetNote.folderId;

        const newTargetIndex = newNotes.findIndex(n => n.id === targetNoteId);
        const isBottom = dragOverItem?.isBottom;
        const finalIndex = newTargetIndex >= 0 ? newTargetIndex : targetIndex;
        const insertIndex = isBottom ? finalIndex + 1 : finalIndex;

        newNotes.splice(insertIndex, 0, removed);
        setNotes(newNotes);
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Yükleniyor...</div>;
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className={`app-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <CategoryModal
        isOpen={isModalOpen}
        initialData={editingFolderId ? folders.find(f => f.id === editingFolderId) : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFolder}
      />

      {isCreateTeamModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>Yeni Ekip Oluştur</h3>
            <input type="text" className="input-field" placeholder="Ekip Adı" value={teamNameForm} onChange={e => setTeamNameForm(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsCreateTeamModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => {
                fetch('/api/teams', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: teamNameForm || 'Yeni Ekip', owner: currentUser })
                }).then(r => r.json()).then(team => {
                  fetchTeams();
                  setIsCreateTeamModalOpen(false);
                  setWorkspace({ type: 'team', id: team.id, name: team.name });
                  setTeamNameForm('');
                });
              }}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {isAddTeamMemberModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsAddTeamMemberModalOpen(false); setTeamMemberForm(''); }}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h3>Ekibe Üye Davet Et</h3>
            <input
              type="text"
              className="input-field"
              placeholder="Kullanıcı Adı Ara..."
              value={teamMemberForm}
              onChange={e => setTeamMemberForm(e.target.value)}
              autoFocus
            />
            {teamMemberForm.trim().length > 0 && (
              <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#09090b', borderRadius: '8px', border: '1px solid var(--card-border)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                {teamMemberSearchResults.map(user => (
                  <div
                    key={user}
                    onClick={() => {
                      fetch(`/api/teams/${workspace.id}/members`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberUsername: user })
                      }).then(r => r.json()).then(res => {
                        fetchTeams();
                        setTeamMemberForm('');
                        if (res.error) alert(res.error);
                      });
                    }}
                    style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <User size={16} color="var(--accent-color)" />
                    {user}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>+ Ekle</span>
                  </div>
                ))}
                {teamMemberSearchResults.length === 0 && <div style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Kullanıcı bulunamadı...</div>}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => { setIsAddTeamMemberModalOpen(false); setTeamMemberForm(''); }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {isManageTeamModalOpen && workspace.type === 'team' && (
        <div className="modal-overlay" onClick={() => setIsManageTeamModalOpen(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h3>Ekip Üyelerini Yönet</h3>
            <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--card-border)', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
              {(userTeams.find(t => t.id === workspace.id)?.members || []).map(member => (
                <div key={member} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="var(--accent-color)" /> {member}
                    {userTeams.find(t => t.id === workspace.id)?.owner === member && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.5rem' }}>Sahip</span>}
                  </div>
                  {member !== currentUser && currentUser === userTeams.find(t => t.id === workspace.id)?.owner && (
                    <button className="btn-icon btn-danger" title="Üyeyi Çıkar" onClick={() => {
                      if (window.confirm(`${member} adlı kullanıcıyı ekipten çıkarmak istediğinize emin misiniz?`)) {
                        fetch(`/api/teams/${workspace.id}/members/${member}`, {
                          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ actor: currentUser })
                        }).then(r => r.json()).then(res => {
                          fetchTeams();
                          if (res.error) alert(res.error);
                        });
                      }
                    }} style={{ padding: '0.3rem', border: 'none', background: 'rgba(239, 68, 68, 0.2)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsManageTeamModalOpen(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`sidebar animate-fade-in ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{workspace.type === 'personal' ? 'Kategoriler' : 'Ekip Alanı'}</h2>
            <button className="btn-icon" onClick={() => setIsSidebarOpen(false)} title="Menüyü Gizle" style={{ padding: '0.25rem', border: 'transparent' }}>
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="workspace-switcher">
            <select
              value={workspace.type === 'personal' ? 'personal' : workspace.id}
              onChange={(e) => {
                if (e.target.value === 'personal') setWorkspace({ type: 'personal', id: currentUser });
                else if (e.target.value === 'create_team') setIsCreateTeamModalOpen(true);
                else setWorkspace({ type: 'team', id: e.target.value, name: e.target.options[e.target.selectedIndex].text });
              }}
              className="input-field"
              style={{ padding: '0.5rem', width: '100%', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#fff', border: '1px solid var(--card-border)', borderRadius: '8px' }}
            >
              <option value="personal">👤 Kişisel Alanım</option>
              {userTeams.map(t => (
                <option key={t.id} value={t.id}>👥 Ekip: {t.name}</option>
              ))}
              <option value="create_team">➕ Yeni Ekip Oluştur</option>
            </select>
            {workspace.type === 'team' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Üyeler: {userTeams.find(t => t.id === workspace.id)?.members?.length || 0} kişi</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn-icon" onClick={() => setIsManageTeamModalOpen(true)} title="Üyeleri Yönet" style={{ padding: '0.2rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                      <Users size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => setIsAddTeamMemberModalOpen(true)} title="Ekibe Üye Ekle" style={{ padding: '0.2rem', background: 'rgba(59, 130, 246, 0.2)' }}>
                      <UserPlus size={14} color="var(--accent-color)" />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn ${isPartyRoomActive ? 'btn-success' : 'btn-secondary'}`}
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', background: isPartyRoomActive ? 'var(--success-color)' : 'rgba(139, 92, 246, 0.15)', borderColor: isPartyRoomActive ? 'transparent' : 'rgba(139, 92, 246, 0.3)', color: isPartyRoomActive ? '#fff' : '#c084fc' }}
                    onClick={fetchPartyNote}
                  >
                    <Sparkles size={14} className={isPartyRoomActive ? 'animate-spin' : ''} />
                    Parti Odasına Gir
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            className="input-field"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              padding: '0.6rem 0.8rem',
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              marginTop: '0.2rem'
            }}
            onClick={() => setIsSpotlightOpen(true)}
          >
            <Search size={16} color="var(--accent-color)" />
            <span style={{ color: 'var(--text-muted)', flex: 1 }}>Tüm notlarda ara...</span>
            <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', opacity: 0.6 }}>⌘K</span>
          </div>
        </div>

        <button className="add-category-btn" onClick={() => { setIsPartyRoomActive(false); setEditingFolderId(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Yeni Kategori Ekle
        </button>

        <div className="note-tree">
          {folders.map(folder => {
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            const isDragOver = dragOverItem?.id === folder.id && dragOverItem?.type === 'folder';
            const isSharedFolder = folder.id === 'f_shared';
            const isDraggingFolder = draggedItem?.id === folder.id && draggedItem?.type === 'folder';

            let dragClass = '';
            if (isDragOver) {
              if (draggedItem?.type === 'note') dragClass = 'drag-over';
              else dragClass = dragOverItem?.isBottom ? 'drag-over-bottom' : 'drag-over-top';
            }

            return (
              <div
                key={folder.id}
                className={`tree-folder ${dragClass} ${isDraggingFolder ? 'dragging-folder' : ''}`}
                draggable={!isSharedFolder}
                onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                onDragEnd={handleDragEnd}
                style={isSharedFolder ? { border: '1px solid rgba(255, 176, 88, 0.2)' } : {}}
              >
                <div className="folder-header" style={{ color: folder.color }}>
                  <div className="folder-header-title">
                    {folder.name}
                  </div>
                  {!isSharedFolder && (
                    <div className="folder-actions">
                      <button className="folder-btn" title="İçine Yeni Not Ekle" onClick={() => addNote(folder.id)}>
                        <Plus size={14} />
                      </button>
                      <button className="folder-btn" title="Kategoriyi Düzenle" onClick={() => { setEditingFolderId(folder.id); setIsModalOpen(true); }}>
                        <Edit3 size={14} />
                      </button>
                      {folders.length > 1 && (
                        <button className="folder-btn" title="Kategoriyi Sil" onClick={() => deleteFolder(folder.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="tree-notes-container">
                  {folderNotes.length === 0 ? (
                    <div style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'rgba(139, 148, 158, 0.5)' }}>Klasör boş...</div>
                  ) : (
                    folderNotes.map(n => {
                      const isNoteDragOver = dragOverItem?.id === n.id && dragOverItem?.type === 'note';
                      const isNoteDragging = draggedItem?.id === n.id && draggedItem?.type === 'note';

                      let dragNoteClass = '';
                      if (isNoteDragOver) {
                        dragNoteClass = dragOverItem?.isBottom ? 'drag-over-bottom' : 'drag-over-top';
                      }

                      return (
                        <div
                          key={n.id}
                          className={`tree-note-item ${n.id === selectedNoteId ? 'active' : ''} ${isNoteDragging ? 'dragging' : ''} ${dragNoteClass}`}
                          onClick={() => setSelectedNoteId(n.id)}
                          draggable={!n.isShared}
                          onDragStart={(e) => handleNoteDragStart(e, n.id)}
                          onDragOver={(e) => handleNoteDragOver(e, n.id)}
                          onDrop={(e) => handleNoteDrop(e, n.id)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                        >
                          <FileType2 size={14} />
                          {n.title || 'İsimsiz Not'}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="main-content">
        <header className="header animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isSidebarOpen && (
              <button
                className="btn-icon"
                onClick={() => setIsSidebarOpen(true)}
                title="Menüyü Göster"
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1>Codepad</h1>
              <p>Şirket içi kod snippet'ları</p>
            </div>
          </div>
          <div className="user-profile">
            <User size={20} color="var(--accent-color)" />
            <span>{currentUser}</span>
            <button className="btn-icon" onClick={() => setIsSettingsOpen(true)} title="Temalar ve Ayarlar" style={{ marginLeft: '0.5rem' }}>
              <Palette size={20} />
            </button>
            <button className="btn-icon" onClick={onLogout} title="Çıkış Yap" style={{ marginLeft: '0.2rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {isPartyRoomActive && partyNote ? (
          <NoteCard
            note={partyNote}
            updateNote={updateNotePartyRoom}
            deleteNote={() => setIsPartyRoomActive(false)}
            currentUser={currentUser}
            workspace={workspace}
            isForcedParty={true}
            aiModel={aiModel}
          />
        ) : selectedNote ? (
          <NoteCard
            note={selectedNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            currentUser={currentUser}
            workspace={workspace}
            aiModel={aiModel}
          />
        ) : (
          <div className="empty-state animate-fade-in">
            <FileCode size={48} />
            <h2>Not Seçilmedi</h2>
            <p style={{ marginTop: '0.5rem' }}>Görüntülemek için menüden bir not seçin veya yeni klasörde not oluşturun.</p>
          </div>
        )}
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
      <Spotlight
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        folders={folders}
        notes={notes}
        teams={userTeams}
        onSelect={handleSpotlightSelect}
      />
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('codepad-currentUser') || null;
  });

  const handleLogin = (username) => {
    localStorage.setItem('codepad-currentUser', username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('codepad-currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <MainApp key={currentUser} currentUser={currentUser} onLogout={handleLogout} />;
}

export default App;
