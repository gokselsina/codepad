import React, { useState, useEffect, useRef } from 'react';
import { Copy, Plus, Trash2, Check, FileCode, FileType2, Edit3, Type, Code, LogOut, User } from 'lucide-react';
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

function NoteCard({ note, updateNote, deleteNote }) {
  const blocks = note.blocks || [];

  const addBlock = (index, type) => {
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
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    updateNote(note.id, 'blocks', newBlocks);
  };

  const removeBlock = (blockId) => {
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
    <div className="glass-card animate-fade-in note-editing-area">
      <div className="note-header-actions">
        <div style={{ flex: 1 }}>
          <input
            className="note-title-input"
            value={note.title || ''}
            onChange={(e) => updateNote(note.id, 'title', e.target.value)}
            placeholder="Not Adı (Örn: Fetch API Kullanımı)"
          />
        </div>
        <button className="btn-icon btn-danger" onClick={() => deleteNote(note.id)} title="Lütfen Sil">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="blocks-container">
        {blocks.map((block, index) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="block-wrapper" style={{ paddingBottom: '0.5rem' }}>
                <div className="block-actions">
                  <button className="block-btn block-btn-danger" onClick={() => removeBlock(block.id)} title="Sil">
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="text-block-input"
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  onInput={handleTextareaInput}
                  placeholder="Metin ekleyin..."
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
                      <button className="btn-icon btn-danger" style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }} onClick={() => removeBlock(block.id)} title="Sil">
                        <Trash2 size={16} />
                      </button>
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
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 14,
                        minHeight: '100px',
                        backgroundColor: '#1e1e1e',
                        minWidth: '100%',
                        width: 'max-content'
                      }}
                      textareaProps={{
                        onPaste: (e) => handlePasteCode(e, block.id, block.content),
                        placeholder: "Kodu buraya yapıştırın, otomatik formatlanacaktır..."
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

      <div className="add-block-menu">
        <button className="add-block-btn" onClick={() => addBlock(blocks.length - 1, 'text')}>
          <Type size={16} /> Metin Ekle
        </button>
        <button className="add-block-btn" onClick={() => addBlock(blocks.length - 1, 'code')}>
          <Code size={16} /> Kod Bloğu
        </button>
      </div>
    </div>
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

  // Veritabanından mevcut kullanıcı koleksiyonunu çek
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

  // Klasörler veya notlar değiştiğinde sunucuya yaz (de-bounce without explicit timer for simplicity)
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
    const newNote = {
      id: Date.now().toString(),
      folderId,
      title: 'Yeni Not',
      blocks: [{ id: Date.now().toString() + 'b1', type: 'text', content: '' }]
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
    if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    setDraggedNoteId(null);
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId) updateNote(noteId, 'folderId', targetFolderId);
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
            <p>Şirket içi kod snippet'ları (Yerel Sunucu)</p>
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

            return (
              <div
                key={folder.id}
                className={`tree-folder ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div className="folder-header" style={{ color: folder.color }}>
                  <div className="folder-header-title">
                    {folder.name}
                  </div>
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
                        draggable
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
