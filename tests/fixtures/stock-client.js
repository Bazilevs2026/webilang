// Browser-test-only Supabase double. No application file imports this fixture.
export function createClient() {
  const read = () => JSON.parse(localStorage.getItem('mock-cloud') || '[]');
  const user = () => localStorage.getItem('mock-user') || null;
  const callbacks = [];
  window.mockSwitchAccount = id => { if (id) localStorage.setItem('mock-user', id); else localStorage.removeItem('mock-user'); callbacks.forEach(fn => fn('SIGNED_IN', id ? { user: { id } } : null)); };
  return {
    auth: {
      getUser: async () => ({ data: { user: user() ? { id: user() } : null } }),
      getSession: async () => ({ data: { session: user() ? { user: { id: user() }, access_token: 'test-' + user() } : null } }),
      onAuthStateChange: fn => callbacks.push(fn)
    },
    from(table) {
      if (table !== 'student_learning_entries') throw Error('Unexpected table');
      let op = 'select', filters = [], content = {}, record, start = 0, end = Infinity, single = false;
      const q = {
        select() { return q; }, eq(k,v) { filters.push([k,v]); return q; },
        contains(_key,v) { content = v; return q; }, order() { return q; },
        range(a,b) { start=a; end=b; return q; }, limit(n) { end=n-1; return q; },
        insert(value) { op='insert'; record=value; return q; },
        delete() { op='delete'; return q; }, single() { single=true; return q; },
        then(resolve,reject) {
          try {
            if (op === 'insert') {
              if (record.user_id !== user()) throw Error('Wrong account insert');
              const row={...record,id:crypto.randomUUID(),created_at:new Date().toISOString()};
              localStorage.setItem('mock-cloud',JSON.stringify([...read(),row])); return Promise.resolve({data:single?row:[row]}).then(resolve,reject);
            }
            if (!filters.some(([k,v])=>k==='user_id'&&v===user())) throw Error('Query must be scoped to current user');
            const matched=read().filter(r=>filters.every(([k,v])=>r[k]===v)&&Object.entries(content).every(([k,v])=>r.content?.[k]===v));
            if(op==='delete')localStorage.setItem('mock-cloud',JSON.stringify(read().filter(r=>!matched.some(m=>m.id===r.id))));
            return Promise.resolve({data:matched.slice(start,end+1)}).then(resolve,reject);
          } catch(error) { return Promise.reject(error).then(resolve,reject); }
        }
      }; return q;
    }
  };
}
