const fs = require('fs');
const file = './src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Copy, Plus, Trash2, Check, FileCode, FileType2, Edit3, Type, Code, LogOut, User, Share2, Search, X, Menu, ChevronLeft } from 'lucide-react';",
"import { Copy, Plus, Trash2, Check, FileCode, FileType2, Edit3, Type, Code, LogOut, User, Share2, Search, X, Menu, ChevronLeft, Users, UserPlus } from 'lucide-react';");

content = content.replace(
`  const [dragOverItem, setDragOverItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const initialMount = useRef(true);`,
`  const [dragOverItem, setDragOverItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [workspace, setWorkspace] = useState({ type: 'personal', id: currentUser });
  const [userTeams, setUserTeams] = useState([]);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [teamNameForm, setTeamNameForm] = useState('');
  const [teamMemberForm, setTeamMemberForm] = useState('');

  const fetchTeams = () => {
    fetch('/api/teams/' + currentUser).then(r => r.json()).then(data => setUserTeams(data));
  };

  useEffect(() => {
    fetchTeams();
  }, [currentUser]);

  const initialMount = useRef(true);`
);

content = content.replace(
`  useEffect(() => {
    fetch(\`/api/collection/\${currentUser}\`)
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
    fetch(\`/api/collection/\${currentUser}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders, notes })
    }).catch(e => console.error("Kayıt hatası:", e));
  }, [folders, notes, loading, currentUser]);`,
`  useEffect(() => {
    setLoading(true);
    const endpoint = workspace.type === 'personal' ? \`/api/collection/\${currentUser}\` : \`/api/teams/collection/\${workspace.id}\`;
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
    const endpoint = workspace.type === 'personal' ? \`/api/collection/\${currentUser}\` : \`/api/teams/collection/\${workspace.id}\`;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders, notes })
    }).catch(e => console.error("Kayıt hatası:", e));
  }, [folders, notes, loading, workspace]);`
);

const newSidebarHeader = `        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Üyeler: {userTeams.find(t=>t.id===workspace.id)?.members?.length} kişi</span>
                <button className="btn-icon" onClick={() => setIsAddTeamMemberModalOpen(true)} title="Ekibe Üye Ekle" style={{ padding: '0.2rem', background: 'rgba(59, 130, 246, 0.2)' }}>
                  <UserPlus size={14} color="var(--accent-color)" />
                </button>
              </div>
            )}
          </div>
        </div>`;
content = content.replace(
`        <div className="sidebar-header">
          <h2>Kategoriler</h2>
          <button className="btn-icon" onClick={() => setIsSidebarOpen(false)} title="Menüyü Gizle" style={{ padding: '0.25rem', border: 'transparent' }}>
            <ChevronLeft size={20} />
          </button>
        </div>`,
newSidebarHeader
);

const newModals = `      <CategoryModal
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
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>Ekibe Üye Davet Et</h3>
            <input type="text" className="input-field" placeholder="Kullanıcı Adı" value={teamMemberForm} onChange={e => setTeamMemberForm(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsAddTeamMemberModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => {
                 fetch(\`/api/teams/\${workspace.id}/members\`, {
                   method: 'POST', headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ memberUsername: teamMemberForm })
                 }).then(r => r.json()).then(res => {
                    fetchTeams();
                    setIsAddTeamMemberModalOpen(false);
                    setTeamMemberForm('');
                    if(res.error) alert(res.error);
                 });
              }}>Davet Et</button>
            </div>
          </div>
        </div>
      )}`;
content = content.replace(
`      <CategoryModal
        isOpen={isModalOpen}
        initialData={editingFolderId ? folders.find(f => f.id === editingFolderId) : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFolder}
      />`,
newModals
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing strings');
