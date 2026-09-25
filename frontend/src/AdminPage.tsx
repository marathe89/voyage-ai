import { useState } from "react";
import { NavIcon } from "./icons";
import { useAuth, type AuthUser } from "./auth";
import { useShell } from "./shell";
import { loadCmsContent, saveCmsContent, CMS_PAGES, type CmsContent, type ContentBlock } from "./cms";

type UserFormState = { name: string; email: string; password: string; phone: string; location: string; role: string };
const emptyUserForm: UserFormState = { name: "", email: "", password: "", phone: "", location: "", role: "user" };

export function AdminPage() {
  const { user, allUsers, isAdmin, roles, setUserRole, createUser, updateUser, removeUser, addRole, updateRole, removeRole } = useAuth();
  const { setToast } = useShell();
  const [tab, setTab] = useState<"users" | "roles" | "content">("users");

  const [cms, setCms] = useState<CmsContent>(loadCmsContent);
  const [cmsPage, setCmsPage] = useState("home");
  const [blockForm, setBlockForm] = useState<{ title: string; subtitle: string; image: string }>({ title: "", subtitle: "", image: "" });
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<UserFormState>(emptyUserForm);

  const [roleForm, setRoleForm] = useState({ name: "", isAdmin: false });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");

  if (!user || !isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <span><NavIcon.shield /></span>
          <h1>Admins only</h1>
          <p>Sign in with an admin account to manage users, roles, and content.</p>
        </div>
      </div>
    );
  }

  function roleName(roleId: string) {
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }

  function submitCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (userForm.password.length < 6) {
      setToast("Password must be at least 6 characters");
      return;
    }
    const result = createUser(userForm);
    if (!result.ok) {
      setToast(result.error ?? "Could not create user");
      return;
    }
    setToast(`${userForm.name} added as ${roleName(userForm.role)}`);
    setUserForm(emptyUserForm);
    setCreatingUser(false);
  }

  function startEditUser(u: AuthUser) {
    setEditingUserId(u.id);
    setEditUserForm({ name: u.name, email: u.email, password: "", phone: u.phone ?? "", location: u.location ?? "", role: u.role });
  }

  function submitEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;
    const result = updateUser(editingUserId, {
      name: editUserForm.name,
      email: editUserForm.email,
      phone: editUserForm.phone,
      location: editUserForm.location,
      role: editUserForm.role,
    });
    if (!result.ok) {
      setToast(result.error ?? "Could not update user");
      return;
    }
    setToast(`${editUserForm.name} updated`);
    setEditingUserId(null);
  }

  function doRemoveUser(u: AuthUser) {
    const result = removeUser(u.id);
    setToast(result.ok ? `${u.name} removed` : result.error ?? "Could not remove user");
  }

  function submitAddRole(e: React.FormEvent) {
    e.preventDefault();
    const result = addRole(roleForm.name, roleForm.isAdmin);
    if (!result.ok) {
      setToast(result.error ?? "Could not create role");
      return;
    }
    setToast(`Role "${roleForm.name}" created`);
    setRoleForm({ name: "", isAdmin: false });
  }

  function submitEditRole(roleId: string) {
    const result = updateRole(roleId, { name: editRoleName });
    if (!result.ok) {
      setToast(result.error ?? "Could not rename role");
      return;
    }
    setEditingRoleId(null);
  }

  function doRemoveRole(roleId: string) {
    const result = removeRole(roleId);
    setToast(result.ok ? "Role deleted" : result.error ?? "Could not delete role");
  }

  const currentBlocks: ContentBlock[] = cms.blocks?.[cmsPage] ?? [];

  function saveCms(next: CmsContent) {
    setCms(next);
    saveCmsContent(next);
  }

  function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockForm.title.trim()) {
      setToast("Content needs a title");
      return;
    }
    const blocksForPage = cms.blocks?.[cmsPage] ?? [];
    let nextBlocks: ContentBlock[];
    if (editingBlockId) {
      nextBlocks = blocksForPage.map((b) => (b.id === editingBlockId ? { ...b, ...blockForm } : b));
    } else {
      nextBlocks = [...blocksForPage, { id: `b-${Date.now()}`, ...blockForm }];
    }
    saveCms({ ...cms, blocks: { ...cms.blocks, [cmsPage]: nextBlocks } });
    setToast(editingBlockId ? "Content updated" : "Content added");
    setBlockForm({ title: "", subtitle: "", image: "" });
    setEditingBlockId(null);
  }

  function startEditBlock(b: ContentBlock) {
    setEditingBlockId(b.id);
    setBlockForm({ title: b.title, subtitle: b.subtitle ?? "", image: b.image ?? "" });
  }

  function deleteBlock(id: string) {
    const nextBlocks = (cms.blocks?.[cmsPage] ?? []).filter((b) => b.id !== id);
    saveCms({ ...cms, blocks: { ...cms.blocks, [cmsPage]: nextBlocks } });
    setToast("Content removed");
    if (editingBlockId === id) {
      setEditingBlockId(null);
      setBlockForm({ title: "", subtitle: "", image: "" });
    }
  }

  function saveHeroFields() {
    saveCms(cms);
    setToast("Home page content updated");
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1><NavIcon.shield /> Governance</h1>
          <p>Manage users, roles, and page content. Changes are stored locally in this browser for this demo.</p>
        </div>
        <div className="admin-tabs">
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><NavIcon.family /> Users</button>
          <button className={tab === "roles" ? "active" : ""} onClick={() => setTab("roles")}><NavIcon.shield /> Roles</button>
          <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}><NavIcon.edit /> Content</button>
        </div>
      </div>

      {tab === "users" && (
        <div className="dash-card admin-users-card">
          <div className="dash-card-head">
            <h3><NavIcon.family /> All Users ({allUsers.length})</h3>
            <button className="dash-btn-primary" onClick={() => { setCreatingUser((v) => !v); setEditingUserId(null); }}>
              <NavIcon.plus /> {creatingUser ? "Cancel" : "Add User"}
            </button>
          </div>

          {creatingUser && (
            <form className="admin-inline-form" onSubmit={submitCreateUser}>
              <div className="admin-inline-form-grid">
                <label>Name<input value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} required /></label>
                <label>Email<input type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required /></label>
                <label>Password<input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" required /></label>
                <label>Role
                  <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <label>Phone <span className="auth-optional">(optional)</span><input value={userForm.phone} onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))} /></label>
                <label>Location <span className="auth-optional">(optional)</span><input value={userForm.location} onChange={(e) => setUserForm((f) => ({ ...f, location: e.target.value }))} /></label>
              </div>
              <button type="submit" className="dash-btn-primary"><NavIcon.check /> Create User</button>
            </form>
          )}

          <div className="admin-user-table">
            <div className="admin-user-row admin-user-row-head">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            {allUsers.map((u) =>
              editingUserId === u.id ? (
                <form key={u.id} className="admin-inline-form admin-edit-user-form" onSubmit={submitEditUser}>
                  <div className="admin-inline-form-grid">
                    <label>Name<input value={editUserForm.name} onChange={(e) => setEditUserForm((f) => ({ ...f, name: e.target.value }))} required /></label>
                    <label>Email<input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))} required /></label>
                    <label>Role
                      <select value={editUserForm.role} onChange={(e) => setEditUserForm((f) => ({ ...f, role: e.target.value }))}>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </label>
                    <label>Phone<input value={editUserForm.phone} onChange={(e) => setEditUserForm((f) => ({ ...f, phone: e.target.value }))} /></label>
                    <label>Location<input value={editUserForm.location} onChange={(e) => setEditUserForm((f) => ({ ...f, location: e.target.value }))} /></label>
                  </div>
                  <div className="admin-content-actions">
                    <button type="submit" className="dash-btn-primary"><NavIcon.check /> Save</button>
                    <button type="button" className="dash-btn-ghost" onClick={() => setEditingUserId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div key={u.id} className="admin-user-row">
                  <span className="admin-user-name"><img src={u.avatar} alt="" /> {u.name}</span>
                  <span>{u.email}</span>
                  <span>
                    <select
                      value={u.role}
                      onChange={(e) => { setUserRole(u.id, e.target.value); setToast(`${u.name} is now ${roleName(e.target.value)}`); }}
                    >
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </span>
                  <span className="admin-row-actions">
                    <button className="dash-btn-ghost admin-remove-btn" onClick={() => startEditUser(u)}><NavIcon.edit /> Edit</button>
                    <button
                      className="dash-btn-ghost admin-remove-btn"
                      disabled={u.id === user.id}
                      onClick={() => doRemoveUser(u)}
                    >
                      <NavIcon.close /> Remove
                    </button>
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div className="dash-card admin-users-card">
          <div className="dash-card-head">
            <h3><NavIcon.shield /> Roles ({roles.length})</h3>
          </div>

          <form className="admin-inline-form admin-role-form" onSubmit={submitAddRole}>
            <label>Role name<input value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Content Editor" required /></label>
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={roleForm.isAdmin} onChange={(e) => setRoleForm((f) => ({ ...f, isAdmin: e.target.checked }))} />
              Grant admin (governance) access
            </label>
            <button type="submit" className="dash-btn-primary"><NavIcon.plus /> Add Role</button>
          </form>

          <div className="admin-user-table">
            <div className="admin-role-row admin-role-row-head">
              <span>Role</span>
              <span>Admin access</span>
              <span>Users</span>
              <span>Actions</span>
            </div>
            {roles.map((r) => {
              const userCount = allUsers.filter((u) => u.role === r.id).length;
              return (
                <div key={r.id} className="admin-role-row">
                  {editingRoleId === r.id ? (
                    <input className="admin-role-edit-input" value={editRoleName} onChange={(e) => setEditRoleName(e.target.value)} autoFocus />
                  ) : (
                    <span>{r.name} {r.builtIn && <em className="admin-role-builtin">Built-in</em>}</span>
                  )}
                  <span>{r.isAdmin ? "Yes" : "No"}</span>
                  <span>{userCount}</span>
                  <span className="admin-row-actions">
                    {editingRoleId === r.id ? (
                      <>
                        <button className="dash-btn-ghost admin-remove-btn" onClick={() => submitEditRole(r.id)}><NavIcon.check /> Save</button>
                        <button className="dash-btn-ghost admin-remove-btn" onClick={() => setEditingRoleId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="dash-btn-ghost admin-remove-btn"
                          disabled={r.builtIn}
                          onClick={() => { setEditingRoleId(r.id); setEditRoleName(r.name); }}
                        >
                          <NavIcon.edit /> Rename
                        </button>
                        <button className="dash-btn-ghost admin-remove-btn" disabled={r.builtIn} onClick={() => doRemoveRole(r.id)}><NavIcon.close /> Delete</button>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "content" && (
        <>
          <div className="dash-card admin-content-card">
            <div className="dash-card-head">
              <h3><NavIcon.edit /> Page Content</h3>
              <select className="admin-page-select" value={cmsPage} onChange={(e) => { setCmsPage(e.target.value); setEditingBlockId(null); setBlockForm({ title: "", subtitle: "", image: "" }); }}>
                {CMS_PAGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {cmsPage === "home" && (
              <div className="admin-content-form">
                <p className="admin-content-subhead">Hero section</p>
                <label>Hero title
                  <input
                    value={cms.homeTitle ?? ""}
                    onChange={(e) => setCms((c) => ({ ...c, homeTitle: e.target.value }))}
                    placeholder="Your AI Travel Concierge for Every Journey"
                  />
                </label>
                <label>Hero subtitle
                  <textarea
                    value={cms.homeSubtitle ?? ""}
                    onChange={(e) => setCms((c) => ({ ...c, homeSubtitle: e.target.value }))}
                    placeholder="Plan, book, and manage your entire trip through intelligent conversations…"
                    rows={3}
                  />
                </label>
                <label>Hero background image URL
                  <input
                    value={cms.homeImage ?? ""}
                    onChange={(e) => setCms((c) => ({ ...c, homeImage: e.target.value }))}
                    placeholder="https://images.example.com/hero.jpg"
                  />
                </label>
                {cms.homeImage && <div className="admin-image-preview" style={{ backgroundImage: `url('${cms.homeImage}')` }} />}
                <div className="admin-content-actions">
                  <button className="dash-btn-primary" onClick={saveHeroFields}><NavIcon.check /> Save Hero</button>
                  <button className="dash-btn-ghost" onClick={() => { const next = { ...cms, homeTitle: undefined, homeSubtitle: undefined, homeImage: undefined }; saveCms(next); setToast("Hero reset to defaults"); }}>Reset Hero</button>
                </div>
              </div>
            )}
          </div>

          <div className="dash-card admin-content-card">
            <div className="dash-card-head">
              <h3><NavIcon.pin /> {CMS_PAGES.find((p) => p.id === cmsPage)?.label} Content Items ({currentBlocks.length})</h3>
            </div>

            <form className="admin-inline-form" onSubmit={submitBlock}>
              <div className="admin-inline-form-grid">
                <label>Title<input value={blockForm.title} onChange={(e) => setBlockForm((f) => ({ ...f, title: e.target.value }))} required /></label>
                <label>Subtitle <span className="auth-optional">(optional)</span><input value={blockForm.subtitle} onChange={(e) => setBlockForm((f) => ({ ...f, subtitle: e.target.value }))} /></label>
                <label>Image URL <span className="auth-optional">(optional)</span><input value={blockForm.image} onChange={(e) => setBlockForm((f) => ({ ...f, image: e.target.value }))} /></label>
              </div>
              <div className="admin-content-actions">
                <button type="submit" className="dash-btn-primary"><NavIcon.check /> {editingBlockId ? "Save Changes" : "Add Content"}</button>
                {editingBlockId && (
                  <button type="button" className="dash-btn-ghost" onClick={() => { setEditingBlockId(null); setBlockForm({ title: "", subtitle: "", image: "" }); }}>Cancel</button>
                )}
              </div>
            </form>

            {currentBlocks.length > 0 ? (
              <div className="admin-block-list">
                {currentBlocks.map((b) => (
                  <div key={b.id} className="admin-block-row">
                    {b.image && <div className="admin-block-thumb" style={{ backgroundImage: `url('${b.image}')` }} />}
                    <div className="admin-block-info"><strong>{b.title}</strong>{b.subtitle && <span>{b.subtitle}</span>}</div>
                    <span className="admin-row-actions">
                      <button className="dash-btn-ghost admin-remove-btn" onClick={() => startEditBlock(b)}><NavIcon.edit /> Edit</button>
                      <button className="dash-btn-ghost admin-remove-btn" onClick={() => deleteBlock(b.id)}><NavIcon.close /> Delete</button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="prof-dna-empty">No content items for this page yet. Add one above.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
