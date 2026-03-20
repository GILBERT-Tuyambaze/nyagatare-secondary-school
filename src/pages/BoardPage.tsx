// src/pages/BoardPage.tsx
import React, { useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MemberType = 'parent' | 'teacher' | 'director';

interface Member {
  id: string;
  name: string;
  role: string;
  type: MemberType;
  email?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
}

const SAMPLE_MEMBERS: Member[] = [
  { id: 'p1', name: 'Amina Uwimana', role: 'Parent Representative', type: 'parent', email: 'amina@example.com', phone: '+250788111222', bio: 'Active PTA member and parent of two NSS students.' },
  { id: 'p2', name: 'Jean Bosco', role: 'Parent Representative', type: 'parent', email: 'jean@example.com', phone: '+250788333444', bio: 'Community leader focusing on student welfare.' },
  { id: 't1', name: 'Dr. Claudine Mukamana', role: 'Head of Science Department', type: 'teacher', email: 'claudine@nyagataress.edu.rw', phone: '+250788555666', bio: 'PhD in Physics. Leads practical STEM programs.' },
  { id: 't2', name: 'Eric Mugisha', role: 'Mathematics Teacher', type: 'teacher', email: 'eric@nyagataress.edu.rw', phone: '+250788777888', bio: 'Coach for math club and national olympiad mentor.' },
  { id: 'd1', name: 'Mr. Paul Nshimiyimana', role: 'School Director', type: 'director', email: 'paul@nyagataress.edu.rw', phone: '+250788999000', bio: 'Director overseeing academics and administration.' },
  { id: 'd2', name: 'Mrs. Rose Hakizimana', role: 'Deputy Director', type: 'director', email: 'rose@nyagataress.edu.rw', phone: '+250788121314', bio: 'Responsible for community partnerships and welfare.' }
];

const TABS: { key: MemberType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'parent', label: 'Parents' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'director', label: 'Directors' }
];

type Props = {
  isAdminProp?: boolean;
};

export default function BoardPage({ isAdminProp }: Props) {
  // page state
  const [members, setMembers] = useState<Member[]>(SAMPLE_MEMBERS);
  const [activeTab, setActiveTab] = useState<MemberType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  // admin logic (prop overrides localStorage)
  const isAdmin = typeof isAdminProp !== 'undefined'
    ? isAdminProp
    : (typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true');

  // add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    role: '',
    type: 'parent' as MemberType,
    email: '',
    phone: '',
    bio: '',
    photoUrl: ''
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(m => {
      if (activeTab !== 'all' && m.type !== activeTab) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      );
    });
  }, [members, activeTab, query]);

  const initials = (name = '') =>
    name
      .split(' ')
      .map(part => (part[0] || '').toUpperCase())
      .slice(0, 2)
      .join('');

  // read image to data URL (used by the add modal)
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => { reader.abort(); reject(new DOMException('Problem parsing input file.')); };
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(file);
    });

  const handlePhotoInput = async (file?: File) => {
    if (!file) {
      setAddForm(f => ({ ...f, photoUrl: '' }));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAddForm(f => ({ ...f, photoUrl: dataUrl }));
    } catch (err) {
      // keep app stable if read fails
      console.error('Failed to read image', err);
    }
  };

  // add member flow
  const openAdd = () => {
    setAddForm({ name: '', role: '', type: 'parent', email: '', phone: '', bio: '', photoUrl: '' });
    setAddErrors({});
    setIsAddOpen(true);
  };
  const validateAdd = () => {
    const e: Record<string, string> = {};
    if (!addForm.name.trim()) e.name = 'Name is required';
    if (!addForm.role.trim()) e.role = 'Role is required';
    if (!addForm.type) e.type = 'Type is required';
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };
  const submitAdd = () => {
    if (!isAdmin) {
      alert('Only admins can add members.');
      return;
    }
    if (!validateAdd()) return;
    const newMember: Member = {
      id: `${addForm.type[0]}-${Date.now()}`,
      name: addForm.name.trim(),
      role: addForm.role.trim(),
      type: addForm.type,
      email: addForm.email.trim() || undefined,
      phone: addForm.phone.trim() || undefined,
      bio: addForm.bio.trim() || undefined,
      photoUrl: addForm.photoUrl || undefined
    };
    setMembers(prev => [newMember, ...prev]);
    setIsAddOpen(false);
  };

  const removeMember = (id: string) => {
    if (!isAdmin) {
      alert('Only admins can delete members.');
      return;
    }
    if (!confirm('Delete this member? This action cannot be undone.')) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    if (selected && selected.id === id) setSelected(null);
  };

  return (
    <>
      <Header />

      {/* Offset so content is not hidden behind fixed header */}
      <main className="pt-24 min-h-[calc(100vh-6rem)] bg-gray-50 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Board — Parents, Teachers & Directors</h1>
              <p className="text-sm text-gray-600 mt-1">Meet the people who guide Nyagatare Secondary School.</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, role, email or bio..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-4 w-80"
                />
              </div>

              {isAdmin && (
                <Button onClick={openAdd} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Member</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === tab.key ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(member => (
              <Card key={member.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-lg font-semibold text-gray-700">{initials(member.name)}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">{member.type}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 truncate">{member.bio || 'No biography provided.'}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 space-y-1">
                      {member.email && <div><strong className="text-gray-800">Email:</strong> <a href={`mailto:${member.email}`} className="text-orange-600">{member.email}</a></div>}
                      {member.phone && <div><strong className="text-gray-800">Phone:</strong> <a href={`tel:${member.phone}`} className="text-orange-600">{member.phone}</a></div>}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => setSelected(member)}>View Profile</Button>
                        {isAdmin && (
                          <Button size="sm" variant="destructive" onClick={() => removeMember(member.id)} className="flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-12">
                No members found. Try clearing filters or adding members.
              </div>
            )}
          </div>

          {/* Profile modal */}
          {selected && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
              <div className="relative mx-auto my-8 max-w-xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto px-4">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {selected.photoUrl ? (
                          <img src={selected.photoUrl} alt={selected.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl font-semibold text-gray-700">{initials(selected.name)}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{selected.name}</h2>
                        <p className="text-sm text-gray-500">{selected.role} • <span className="capitalize">{selected.type}</span></p>
                        <p className="mt-4 text-sm text-gray-700">{selected.bio || 'No biography provided.'}</p>

                        <div className="mt-4 space-y-1 text-sm text-gray-700">
                          {selected.email && <div><strong>Email:</strong> <a href={`mailto:${selected.email}`} className="text-orange-600">{selected.email}</a></div>}
                          {selected.phone && <div><strong>Phone:</strong> <a href={`tel:${selected.phone}`} className="text-orange-600">{selected.phone}</a></div>}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                          <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Member modal */}
          {isAddOpen && (
            <div className="fixed inset-0 z-60">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddOpen(false)} />
              <div className="relative mx-auto my-8 max-w-lg w-full max-h-[calc(100vh-4rem)] overflow-y-auto px-4">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Add Board Member</h3>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-sm font-medium">Photo (optional)</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
                            {addForm.photoUrl ? (
                              <img src={addForm.photoUrl} alt="preview" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-gray-500">No image</span>
                            )}
                          </div>
                          <div>
                            <input
                              id="photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoInput(file);
                                else handlePhotoInput(undefined);
                              }}
                            />
                            <div className="text-xs text-gray-500">PNG/JPG up to 5MB</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Full name *</label>
                        <Input value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))} />
                        {addErrors.name && <p className="text-xs text-red-500">{addErrors.name}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Role *</label>
                        <Input value={addForm.role} onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value }))} />
                        {addErrors.role && <p className="text-xs text-red-500">{addErrors.role}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Type *</label>
                        <Select value={addForm.type} onValueChange={(val) => setAddForm(f => ({ ...f, type: val as MemberType }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="director">Director</SelectItem>
                          </SelectContent>
                        </Select>
                        {addErrors.type && <p className="text-xs text-red-500">{addErrors.type}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <Input value={addForm.bio} onChange={(e) => setAddForm(f => ({ ...f, bio: e.target.value }))} />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                      <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button onClick={submitAdd}>Add Member</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
