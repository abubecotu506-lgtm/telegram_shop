// Scope is per update, never shared between concurrent Worker requests.
export async function renderMenuUpdate(env, chatId, navigation, incomingId, dispatch, remove) {
  const fresh = new Set();
  const scope = Object.create(env);
  scope.menuTrace = { chatId, fresh };
  let prior = [];
  try {
    if (navigation) {
      const rows = await env.DB.prepare('SELECT message_id FROM chat_menu_messages WHERE chat_id=? AND created_at > unixepoch()-172800 ORDER BY message_id DESC LIMIT 100').bind(chatId).all();
      prior = rows.results.map(row => row.message_id);
    }
  } catch (err) { console.warn('menu lookup:', err.message); }
  const result = await dispatch(scope);
  // If the next screen failed to render, retain the last usable screen.
  if (!fresh.size) return result;
  try {
    if (incomingId) fresh.add(incomingId);
    await env.DB.batch([...fresh].map(id => env.DB.prepare('INSERT OR IGNORE INTO chat_menu_messages(chat_id,message_id) VALUES(?,?)').bind(chatId,id)));
    const old = prior.filter(id => !fresh.has(id));
    if (old.length) {
      const deleted = await remove(old);
      if (deleted?.ok) await env.DB.batch(old.map(id => env.DB.prepare('DELETE FROM chat_menu_messages WHERE chat_id=? AND message_id=?').bind(chatId,id)));
    }
  } catch (err) { console.warn('menu cleanup:',err.message); }
  return result;
}
