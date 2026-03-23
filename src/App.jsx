import React, { useState, useEffect, useRef } from 'react';
import { Copy, Plus, Trash2, Check, FileCode, FileType2, Edit3, Type, Code, LogOut, User, Share2, Search, X } from 'lucide-react';
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

function NoteCard({ note, updateNote, deleteNote, currentUser }) {
  const blocks = note.blocks || [];
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isReadOnly = !!note.isShared;

  const addBlock = (index, type) => {
    if (isReadOnly) return;
    const newBlock = { id: Date.now().toString() + Math.random(), type, content: '' };
    const newBlocks = [...blocks];
    if (index === -1) {
      newBlocks.push(newBlock);
    } else {
      newBlocks.splice(index + 1, 0, newBlock);
    }
    updateNote(note.id, 'blocks', newBlocks);
  };

  const updateBlock = (blockId, content) => {
    if (isReadOnly) return;
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    updateNote(note.id, 'blocks', newBlocks);
  };

  const removeBlock = (blockId) => {
    if (isReadOnly) return;
    const newBlocks = blocks.filter(b => b.id !== blockId);
    updateNote(note.id, 'blocks', newBlocks);
  };

  const [copiedBlockId, setCopiedBlockId] = useState(null);

  const handleCopy = (blockId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 2000);
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
          {!isReadOnly && (
            <button className="btn-icon" onClick={() => setIsShareModalOpen(true)} title="Paylaş" style={{ marginRight: '0.5rem' }}>
              <Share2 size={20} />
            </button>
          )}
          {!isReadOnly && (
            <button className="btn-icon btn-danger" onClick={() => deleteNote(note.id)} title="Lütfen Sil">
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="blocks-container">
          {blocks.map((block) => {
            if (block.type === 'text') {
              return (
                <div key={block.id} className="block-wrapper" style={{ paddingBottom: '0.5rem' }}>
                  {!isReadOnly && (
                    <div className="block-actions">
                      <button className="block-btn block-btn-danger" onClick={() => removeBlock(block.id)} title="Sil">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <textarea
                    className="text-block-input"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    onInput={handleTextareaInput}
                    placeholder={isReadOnly ? "" : "Metin ekleyin..."}
                    readOnly={isReadOnly}
                  />
                </div>
              );
            } else if (block.type === 'code') {
              return (
                <div key={block.id} className="block-wrapper">
                  <div className="code-wrapper">
                    <div className="code-header">
                      <span>Kod Bloğu</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCopy(block.id, block.content)}>
                          {copiedBlockId === block.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedBlockId === block.id ? 'Kopyalandı!' : 'Kopyala'}
                        </button>
                        {!isReadOnly && (
                          <button className="btn-icon btn-danger" style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }} onClick={() => removeBlock(block.id)} title="Sil">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="code-editor-container">
                      <Editor
                        value={block.content}
                        onValueChange={(code) => updateBlock(block.id, code)}
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
                </div>
              );
            }
            return null;
          })}
        </div>

        {!isReadOnly && (
          <div className="add-block-menu">
            <button className="add-block-btn" onClick={() => addBlock(blocks.length - 1, 'text')}>
              <Type size={16} /> Metin Ekle
            </button>
            <button className="add-block-btn" onClick={() => addBlock(blocks.length - 1, 'code')}>
              <Code size={16} /> Kod Bloğu
            </button>
          </div>
        )}
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
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const initialMount = useRef(true);

  useEffect(() => {
    fetch(`/api/collection/${currentUser}`)
      .then(res => res.json())
      .then(data => {
        setFolders(data.folders || []);
        setNotes(data.notes || []);
        if (data.notes && data.notes.length > 0) {
          setSelectedNoteId(data.notes[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Veri çekme hatası:", err);
        setLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    if (loading) return;
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetch(`/api/collection/${currentUser}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders, notes })
    }).catch(e => console.error("Kayıt hatası:", e));
  }, [folders, notes, loading, currentUser]);

  const handleSaveFolder = (data) => {
    if (editingFolderId) {
      setFolders(folders.map(f => f.id === editingFolderId ? { ...f, ...data } : f));
    } else {
      setFolders([...folders, { id: 'f_' + Date.now().toString(), ...data }]);
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

  const updateNote = (id, field, value) => {
    setNotes(notes.map(note => note.id === id ? { ...note, [field]: value } : note));
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (selectedNoteId === id) setSelectedNoteId(updated.length > 0 ? updated[0].id : null);
  };

  const handleDragStart = (e, noteId) => {
    e.dataTransfer.setData('noteId', noteId);
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    if (dragOverFolderId !== folderId && folderId !== 'f_shared') setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    setDraggedNoteId(null);
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId && targetFolderId !== 'f_shared') {
      const draggedNote = notes.find(n => n.id === noteId);
      if (draggedNote && !draggedNote.isShared) {
        updateNote(noteId, 'folderId', targetFolderId);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverFolderId(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Yükleniyor...</div>;
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="app-layout">
      <CategoryModal
        isOpen={isModalOpen}
        initialData={editingFolderId ? folders.find(f => f.id === editingFolderId) : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFolder}
      />

      <main className="main-content">
        <header className="header animate-fade-in">
          <div>
            <h1>Codepad</h1>
            <p>Şirket içi kod snippet'ları</p>
          </div>
          <div className="user-profile">
            <User size={20} color="var(--accent-color)" />
            <span>{currentUser}</span>
            <button className="btn-icon" onClick={onLogout} title="Çıkış Yap" style={{ marginLeft: '0.5rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {selectedNote ? (
          <NoteCard
            note={selectedNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            currentUser={currentUser}
          />
        ) : (
          <div className="empty-state animate-fade-in">
            <FileCode size={48} />
            <h2>Not Seçilmedi</h2>
            <p style={{ marginTop: '0.5rem' }}>Görüntülemek için sağdaki menüden bir not seçin veya yeni klasörde not oluşturun.</p>
          </div>
        )}
      </main>

      <aside className="right-sidebar animate-fade-in">
        <div className="sidebar-header">
          <h2>Kategoriler</h2>
        </div>

        <button className="add-category-btn" onClick={() => { setEditingFolderId(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Yeni Kategori Ekle
        </button>

        <div className="note-tree">
          {folders.map(folder => {
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            const isDragOver = dragOverFolderId === folder.id;
            const isSharedFolder = folder.id === 'f_shared';

            return (
              <div
                key={folder.id}
                className={`tree-folder ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
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
                    folderNotes.map(n => (
                      <div
                        key={n.id}
                        className={`tree-note-item ${n.id === selectedNoteId ? 'active' : ''} ${draggedNoteId === n.id ? 'dragging' : ''}`}
                        onClick={() => setSelectedNoteId(n.id)}
                        draggable={!n.isShared}
                        onDragStart={(e) => handleDragStart(e, n.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <FileType2 size={14} />
                        {n.title || 'İsimsiz Not'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
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
