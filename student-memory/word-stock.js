// Uses the existing AI-module Stock schema, not a separate table or browser cache.
export const normal = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
export function wordOf(row) {
  const item = row.content?.item;
  return String(item?.word || item?.phrase || item?.text || '').trim().replace(/\s+/g, ' ');
}
export async function readWords(db, userId) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('student_learning_entries')
      .select('id,user_id,module,content,created_at').eq('user_id', userId)
      .eq('kind', 'memory_note').contains('content', { type: 'words' })
      .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []).filter(row => row.user_id === userId && wordOf(row)));
    if (!data || data.length < 500) return rows;
  }
}
export async function insertWord(db, userId, word) {
  const { data, error } = await db.from('student_learning_entries').insert({
    user_id: userId, kind: 'memory_note', module: 'Art Lab',
    content: { source: 'webilang-ai-stock-v1', version: 1, type: 'words', item: { word, source: 'Art Lab' }, text: word }
  }).select('id,user_id,module,content,created_at').single();
  if (error) throw error;
  return data;
}
export async function deleteWord(db, userId, id) {
  const { error } = await db.from('student_learning_entries').delete()
    .eq('user_id', userId).eq('id', id).eq('kind', 'memory_note').contains('content', { type: 'words' });
  if (error) throw error;
}
