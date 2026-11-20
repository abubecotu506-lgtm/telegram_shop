import test from 'node:test';
import assert from 'node:assert/strict';
import {handleUpdate} from '../lib/bot.js';
import {isAdminUser,getAdminIds} from '../lib/db.js';
for(const type of ['group','supergroup','channel'])test(`ignore all ${type} events before IO`,async()=>{
 const m={chat:{type,id:-100},from:{id:123},text:'/admin'};
 for(const update of [{message:m},{edited_message:m},{callback_query:{data:'adminhome',message:m}},{channel_post:m},{callback_query:{inline_message_id:'old'}}])await handleUpdate(update,{},{});
});
test('only panel membership grants bot admin',async()=>{
 const db={prepare(sql){assert.match(sql,/FROM panel_admins/);return {all:async()=>({results:[{user_id:2}]}),bind:id=>({first:async()=>id===2?{ok:1}:null})}}};
 const env={ADMIN_IDS:'1'};assert.equal(await isAdminUser(db,env,1),false);assert.equal(await isAdminUser(db,env,2),true);assert.deepEqual(await getAdminIds(db,env),[2]);
});
