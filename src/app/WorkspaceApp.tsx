import { useEffect, useMemo, useReducer, useState } from 'react';

import { projectWorkspaceGraph, type GraphNode } from '../domain/graph/projectGraph';
import { exportWorkspaceJson, importWorkspaceJson } from '../domain/workspace/io';
import { createChatReference, createEntityId, createFolder, createInitialWorkspace, createLocalNote, type ChatReference, type LocalNote, type WorkspaceTab } from '../domain/workspace/model';
import { workspaceReducer } from '../domain/workspace/workspaceReducer';
import { CommandPalette, type WorkspaceCommand } from '../features/command-palette/CommandPalette';
import { GraphNavigator } from '../features/graph/GraphNavigator';
import '../features/graph/graph.css';
import { LocalNoteEditor } from '../features/local-notes/LocalNoteEditor';
import '../features/local-notes/local-notes.css';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import '../features/settings/settings.css';
import { SpatialWorkspace } from '../features/workspace-layout/SpatialWorkspace';
import { WorkspaceTree } from '../features/workspace-tree/WorkspaceTree';
import { WorkspaceTabs } from '../features/tabs/WorkspaceTabs';
import { createDefaultWorkspaceRepository } from '../persistence/chromeStorageWorkspaceRepository';
import type { WorkspaceRepository } from '../persistence/workspaceRepository';
import { getChatGptCapability, navigateToChatGptTarget } from '../providers/chatgpt/adapter';

interface WorkspaceAppProps { repository?:WorkspaceRepository; currentUrl?:()=>string; navigate?:(url:string)=>void; downloadText?:(filename:string,content:string)=>void; }
type PersistenceState='loading'|'ready'|'blocked';

function messageFromError(error:unknown):string{return error instanceof Error?error.message:'Local storage operation failed.';}
function recoveryText(raw:unknown|null):string|null{if(raw===null)return null;try{return JSON.stringify(raw,null,2);}catch{return String(raw);}}
function defaultDownloadText(filename:string,content:string){const blob=new Blob([content],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url);}

export function WorkspaceApp({repository,currentUrl=()=>window.location.href,navigate=(url)=>window.location.assign(url),downloadText=defaultDownloadText}:WorkspaceAppProps){
  const workspaceRepository=useMemo(()=>repository??createDefaultWorkspaceRepository(),[repository]);
  const [workspace,dispatch]=useReducer(workspaceReducer,undefined,()=>createInitialWorkspace());
  const [persistenceState,setPersistenceState]=useState<PersistenceState>('loading');
  const [persistenceError,setPersistenceError]=useState<string|null>(null);
  const [recoveryJson,setRecoveryJson]=useState<string|null>(null);
  const [selectedFolderId,setSelectedFolderId]=useState<string|null>(null);
  const [status,setStatus]=useState('Local workspace ready.');
  const [paletteOpen,setPaletteOpen]=useState(false);
  const graph=useMemo(()=>projectWorkspaceGraph(workspace),[workspace]);
  const exportJson=useMemo(()=>exportWorkspaceJson(workspace),[workspace]);

  useEffect(()=>{let cancelled=false;void(async()=>{try{const saved=await workspaceRepository.load();if(cancelled)return;if(saved!==null)dispatch({type:'workspace/replace',snapshot:saved});setPersistenceState('ready');}catch(error){if(cancelled)return;let raw:unknown|null=null;try{raw=await workspaceRepository.readRaw();}catch{raw=null;}setRecoveryJson(recoveryText(raw));setPersistenceError(`Storage recovery required. ${messageFromError(error)}`);setPersistenceState('blocked');}})();return()=>{cancelled=true;};},[workspaceRepository]);
  useEffect(()=>{if(persistenceState!=='ready')return;void workspaceRepository.save(workspace).catch(async(error)=>{let raw:unknown|null=null;try{raw=await workspaceRepository.readRaw();}catch{raw=null;}setRecoveryJson(recoveryText(raw));setPersistenceError(`Saving was blocked. ${messageFromError(error)}`);setPersistenceState('blocked');});},[persistenceState,workspace,workspaceRepository]);
  useEffect(()=>{const onKeyDown=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setPaletteOpen((current)=>!current);}};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown);},[]);

  function openTab(tab:WorkspaceTab){dispatch({type:'tab/open',tab,now:Date.now()});}
  function chatTab(chat:ChatReference):WorkspaceTab{return{id:`tab-chat-${chat.id}`,kind:'chat',entityId:chat.id,title:chat.label,pinned:false};}
  function noteTab(note:LocalNote):WorkspaceTab{return{id:`tab-note-${note.id}`,kind:'note',entityId:note.id,title:note.title,pinned:false};}
  function addFolder(){const now=Date.now();const folder=createFolder({id:createEntityId('folder'),name:'New folder',parentId:selectedFolderId,now});dispatch({type:'folder/create',folder});setSelectedFolderId(folder.id);setStatus('Folder created locally.');}
  function addNote(){const now=Date.now();const note=createLocalNote({id:createEntityId('note'),title:'Untitled note',folderId:selectedFolderId,now});dispatch({type:'note/create',note});dispatch({type:'tab/open',tab:noteTab(note),now});setStatus('Note created locally.');}
  function saveCurrentChat(){const capability=getChatGptCapability(currentUrl());if(capability.currentTarget===null){setStatus('Open a ChatGPT conversation before saving a reference.');return;}const existing=workspace.chatRefs.find((chat)=>chat.target===capability.currentTarget);if(existing!==undefined){openTab(chatTab(existing));setStatus('Conversation reference is already saved.');return;}const now=Date.now();const chat=createChatReference({id:createEntityId('chat'),label:`Conversation ${workspace.chatRefs.length+1}`,target:capability.currentTarget,folderId:selectedFolderId,now});dispatch({type:'chat/create',chat});dispatch({type:'tab/open',tab:chatTab(chat),now});setStatus('Conversation reference saved locally.');}
  function openSavedChat(chat:ChatReference){openTab(chatTab(chat));navigateToChatGptTarget(chat.target,navigate);}
  function openNote(note:LocalNote){openTab(noteTab(note));}
  function openGraph(){openTab({id:'tab-graph',kind:'graph',entityId:null,title:'Graph',pinned:false});}
  function openSettings(){openTab({id:'tab-settings',kind:'settings',entityId:null,title:'Settings',pinned:false});}
  function openHome(){dispatch({type:'tab/activate',tabId:'tab-home',now:Date.now()});}
  function openGraphNode(node:GraphNode){if(node.kind==='chat'){const chat=workspace.chatRefs.find((item)=>item.id===node.entityId);if(chat!==undefined)openTab(chatTab(chat));return;}if(node.kind==='note'){const note=workspace.notes.find((item)=>item.id===node.entityId);if(note!==undefined)openNote(note);return;}if(node.kind==='folder'){setSelectedFolderId(node.entityId);openHome();return;}openHome();}
  function createManualEdge(sourceEntityId:string,targetEntityId:string){const now=Date.now();dispatch({type:'edge/create',edge:{id:createEntityId('edge'),sourceEntityId,targetEntityId,kind:'related-manually',createdAt:now},now});}
  async function importBackup(json:string){const snapshot=importWorkspaceJson(json);try{await workspaceRepository.save(snapshot);dispatch({type:'workspace/replace',snapshot});setPersistenceError(null);setRecoveryJson(null);setPersistenceState('ready');setStatus('Backup imported.');}catch(error){setPersistenceError(`Import could not be saved. ${messageFromError(error)}`);setPersistenceState('blocked');throw error;}}
  async function resetLocalData(){try{await workspaceRepository.clear();const reset=createInitialWorkspace();dispatch({type:'workspace/replace',snapshot:reset});setSelectedFolderId(null);setPersistenceError(null);setRecoveryJson(null);setPersistenceState('ready');setStatus('Local workspace reset.');}catch(error){setPersistenceError(`Reset failed. ${messageFromError(error)}`);setPersistenceState('blocked');throw error;}}

  const commands:WorkspaceCommand[]=[{id:'folder-create',label:'Create folder',run:addFolder},{id:'note-create',label:'Create note',run:addNote},{id:'chat-save',label:'Save current chat',run:saveCurrentChat},{id:'graph-open',label:'Open graph',run:openGraph},{id:'settings-open',label:'Open settings',run:openSettings},{id:'home-open',label:'Open home',run:openHome}];
  const activeTab=workspace.tabs.find((tab)=>tab.id===workspace.activeTabId)??workspace.tabs[0];
  const activeChat=activeTab?.kind==='chat'?workspace.chatRefs.find((chat)=>chat.id===activeTab.entityId):undefined;
  const activeNote=activeTab?.kind==='note'?workspace.notes.find((note)=>note.id===activeTab.entityId):undefined;
  const capability=getChatGptCapability(currentUrl());
  const compatibilityLabel=capability.canCaptureCurrentReference?'Conversation detected':capability.supportedOrigin?'ChatGPT page detected':'Unsupported host';

  const surfaceContent=activeTab?.kind==='settings'?<SettingsPanel exportJson={exportJson} recoveryJson={recoveryJson} persistenceError={persistenceError} onImport={importBackup} onReset={resetLocalData} onDownload={downloadText}/>:activeTab?.kind==='graph'?<GraphNavigator graph={graph} onOpenNode={openGraphNode} onCreateManualEdge={createManualEdge}/>:activeNote!==undefined?<LocalNoteEditor note={activeNote} chats={workspace.chatRefs} onChange={(note)=>dispatch({type:'note/update',note,now:Date.now()})} onLinkChat={(chatId)=>dispatch({type:'note/link-chat',noteId:activeNote.id,chatId,now:Date.now()})}/>:activeChat!==undefined?<section className="workspace-home"><strong>{activeChat.label}</strong><p>{activeChat.target}</p><button type="button" onClick={()=>openSavedChat(activeChat)}>Open in ChatGPT</button></section>:<section className="workspace-home"><strong>{workspace.name}</strong><p>{status}</p><dl className="workspace-stats"><div><dt>Folders</dt><dd>{workspace.folders.length}</dd></div><div><dt>Chats</dt><dd>{workspace.chatRefs.length}</dd></div><div><dt>Notes</dt><dd>{workspace.notes.length}</dd></div></dl></section>;
  const surface=<div className="workspace-surface-stack"><WorkspaceTabs tabs={workspace.tabs} activeTabId={workspace.activeTabId} onActivate={(tabId)=>dispatch({type:'tab/activate',tabId,now:Date.now()})} onClose={(tabId)=>dispatch({type:'tab/close',tabId,now:Date.now()})}/>{surfaceContent}</div>;
  const tree=<><div className="tree-toolbar tree-toolbar--stack"><div><button type="button" onClick={addFolder}>New folder</button><button type="button" onClick={addNote}>New note</button></div><button type="button" onClick={saveCurrentChat}>Save current chat</button></div><WorkspaceTree folders={workspace.folders} chatRefs={workspace.chatRefs} notes={workspace.notes} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onOpenChat={openSavedChat} onOpenNote={openNote}/></>;
  return <><SpatialWorkspace tree={tree} surface={surface} provider={<div className="provider-panel-content"><div className="compatibility-status" data-supported={capability.supportedOrigin?'true':'false'}><span className="compatibility-dot" aria-hidden="true"/><span>{compatibilityLabel}</span></div>{persistenceError!==null&&<div className="provider-storage-warning" role="alert">{persistenceError}<button type="button" onClick={openSettings}>Recover</button></div>}<p className="panel-empty">ChatGPT stays native on the host page. Only validated conversation URLs are stored.</p><button type="button" onClick={()=>setPaletteOpen(true)}>Commands</button><span className="keyboard-hint">Ctrl/⌘ K</span></div>}/>{paletteOpen&&<CommandPalette commands={commands} onClose={()=>setPaletteOpen(false)}/>}</>;
}
