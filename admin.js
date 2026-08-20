const cfg = window.JOLIE_SUPABASE;
const db = window.supabase.createClient(cfg.url, cfg.key);
const $ = (s, r=document) => r.querySelector(s);
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const splitList = v => String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
const slugify = v => String(v||'produto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70) || 'produto';
const labels={conjuntos:'Conjuntos',tops:'Tops',regatas:'Regatas',vestidos:'Vestidos',shorts:'Shorts',saias:'Saias',calcas:'Calças',acessorios:'Acessórios',outros:'Outros'};
let products=[]; let selected=null; let imageFile=null;

const ui={
 authScreen:$('#authScreen'), adminApp:$('#adminApp'), loginForm:$('#loginForm'), email:$('#loginEmail'), password:$('#loginPassword'), authMessage:$('#authMessage'), signup:$('#signupButton'), logout:$('#logoutButton'), adminEmail:$('#adminEmail'),
 list:$('#productList'), search:$('#productSearch'), filter:$('#statusFilter'), count:$('#listCount'), form:$('#productForm'), empty:$('#emptyEditor'), title:$('#editorTitle'), subtitle:$('#editorSubtitle'), preview:$('#previewCard'), imagePreview:$('#imagePreview'), imageInput:$('#productImage'), imageName:$('#imageFileName'), state:$('#publishState'), toast:$('#toastRegion')
};
const f={name:$('#productName'),category:$('#productCategory'),price:$('#productPrice'),description:$('#productDescription'),order:$('#productOrder'),sizes:$('#productSizes'),colors:$('#productColors'),patterns:$('#productPatterns'),installments:$('#productInstallments'),interestFree:$('#interestFree'),status:$('#productStatus'),launch:$('#productLaunch'),isNew:$('#productNew'),featured:$('#productFeatured'),badge:$('#badgeText'),tone:$('#badgeTone')};

function toast(title,msg,type='success'){const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<strong>${title}</strong><span>${msg}</span>`;ui.toast.append(el);setTimeout(()=>el.remove(),4200)}
function setAuthMessage(msg){ui.authMessage.textContent=msg||''}
function showLogin(message=''){
 ui.authScreen.hidden=false;
 ui.adminApp.hidden=true;
 if(message) setAuthMessage(message);
}
function enterAdmin(session){
 setAuthMessage('');
 ui.authScreen.hidden=true;
 ui.adminApp.hidden=false;
 ui.adminEmail.textContent=session?.user?.email||'Administradora';
 // O catálogo pode carregar depois; a tela não precisa esperar a consulta terminar.
 setTimeout(()=>loadProducts(),0);
}
async function isAdmin(session){
 if(!session?.user?.id||!session?.access_token) return {ok:false,error:'Sessão inválida.'};
 try{
  // Faz a checagem via REST com o JWT da sessão. Isso evita a disputa de lock
  // do cliente de Auth logo após signInWithPassword no navegador/mobile.
  const url=`${cfg.url}/rest/v1/admin_users?select=user_id,email&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`;
  const response=await fetch(url,{
   headers:{
    apikey:cfg.key,
    Authorization:`Bearer ${session.access_token}`,
    Accept:'application/json'
   },
   cache:'no-store'
  });
  if(!response.ok){
   const body=await response.text();
   return {ok:false,error:body||`Falha ao validar acesso (${response.status}).`};
  }
  const rows=await response.json();
  return {ok:Array.isArray(rows)&&rows.length>0,error:null};
 }catch(err){
  return {ok:false,error:err?.message||'Falha de conexão ao validar o administrador.'};
 }
}
async function showForSession(session){
 if(!session){showLogin();return false}
 const check=await isAdmin(session);
 if(!check.ok){
  showLogin(check.error
   ? `Login realizado, mas não foi possível validar o acesso: ${check.error}`
   : 'Este e-mail entrou no Supabase, mas ainda não foi autorizado como administrador.');
  return false;
 }
 enterAdmin(session);
 return true;
}

ui.loginForm.addEventListener('submit',async e=>{
 e.preventDefault();
 const submit=ui.loginForm.querySelector('button[type="submit"]');
 if(submit) submit.disabled=true;
 setAuthMessage('Entrando...');
 let fallbackReload=null;
 try{
  const {data,error}=await db.auth.signInWithPassword({
   email:ui.email.value.trim().toLowerCase(),
   password:ui.password.value
  });
  if(error){setAuthMessage(error.message);return}
  const session=data?.session;
  if(!session){setAuthMessage('O login foi aceito, mas a sessão não foi criada. Tente novamente.');return}

  // Se algum navegador travar a primeira consulta logo após o login, recarrega sozinho.
  // A sessão já fica persistida pelo Supabase e o painel abre no carregamento seguinte.
  fallbackReload=setTimeout(()=>{
   if(!ui.authScreen.hidden) location.reload();
  },1800);

  const opened=await showForSession(session);
  if(opened&&fallbackReload){clearTimeout(fallbackReload);fallbackReload=null}
 }catch(err){
  if(fallbackReload) clearTimeout(fallbackReload);
  setAuthMessage(err?.message||'Não foi possível concluir o login.');
 }finally{
  if(submit) submit.disabled=false;
 }
});
ui.signup.addEventListener('click',async()=>{if(!ui.email.value||ui.password.value.length<6){setAuthMessage('Informe o e-mail e uma senha com pelo menos 6 caracteres.');return}setAuthMessage('Criando acesso...');const {data,error}=await db.auth.signUp({email:ui.email.value.trim(),password:ui.password.value});if(error){setAuthMessage(error.message);return}if(data.session){await showForSession(data.session)}else setAuthMessage('Cadastro criado. Confirme o e-mail recebido e depois entre no painel.')});
ui.logout.addEventListener('click',async()=>{await db.auth.signOut();location.reload()});

async function loadProducts(){
 const {data,error}=await db.from('products').select('*').order('is_launch',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
 if(error){toast('Erro',error.message,'error');return} products=data||[]; renderList();updateStats();
}
function updateStats(){
 $('#statActive').textContent=products.filter(p=>p.status==='published').length;
 $('#statLaunches').textContent=products.filter(p=>p.is_launch).length;
 $('#statSoldOut').textContent=products.filter(p=>p.status==='sold_out').length;
 $('#statTotal').textContent=products.length;
}
function renderList(){
 const term=ui.search.value.trim().toLowerCase();const filter=ui.filter.value;
 let list=products.filter(p=>{if(filter==='launch'&&!p.is_launch)return false;if(filter!=='all'&&filter!=='launch'&&p.status!==filter)return false;const hay=[p.name,p.category,p.description,...(p.colors||[]),...(p.sizes||[]),...(p.patterns||[])].join(' ').toLowerCase();return !term||hay.includes(term)});
 ui.list.replaceChildren();ui.count.textContent=`${list.length} ${list.length===1?'item':'itens'}`;
 if(!list.length){ui.list.innerHTML='<div class="product-list-empty">Nenhuma peça encontrada.</div>';return}
 for(const p of list){const b=document.createElement('button');b.type='button';b.className='product-list-item'+(selected?.id===p.id?' active':'');b.dataset.id=p.id;b.innerHTML=`<img src="${p.image_url||''}" alt=""><div class="product-list-item-info"><strong>${p.name}</strong><span>${p.is_launch?'Lançamento · ':''}${labels[p.category]||p.category}</span><small>${money(p.price)}</small></div><span class="product-status-dot ${p.status==='sold_out'?'soldout':p.status==='hidden'||p.status==='draft'?'hidden':'available'}"></span>`;ui.list.append(b)}
}
function openEditor(p=null){selected=p?{...p}:null;ui.empty.hidden=true;ui.form.hidden=false;imageFile=null;ui.imageInput.value='';ui.imageName.textContent='Nenhum arquivo novo selecionado.';ui.title.textContent=p?'Editar peça':'Nova peça';
 f.name.value=p?.name||'';f.category.value=p?.category||'';f.price.value=p?.price??'';f.description.value=p?.description||'';f.order.value=p?.sort_order??100;f.sizes.value=(p?.sizes||[]).join(', ');f.colors.value=(p?.colors||[]).join(', ');f.patterns.value=(p?.patterns||[]).join(', ');f.installments.value=String(p?.installments||2);f.interestFree.checked=p?.interest_free!==false;f.status.value=p?.status||'published';f.launch.checked=!!p?.is_launch;f.isNew.checked=!!p?.is_new;f.featured.checked=!!p?.featured;f.badge.value=p?.badge||'';f.tone.value=p?.badge_style||'pink';renderImage(p?.image_url||'');renderPreview();renderList();window.scrollTo({top:0,behavior:'smooth'});
}
function renderImage(src){ui.imagePreview.replaceChildren();if(!src){ui.imagePreview.innerHTML='<span>Sem foto</span>';return}const img=new Image();img.src=src;img.alt='Prévia da peça';ui.imagePreview.append(img)}
function currentDraft(){return{name:f.name.value.trim(),category:f.category.value,price:Number(f.price.value||0),description:f.description.value.trim(),sort_order:Number(f.order.value||0),sizes:splitList(f.sizes.value),colors:splitList(f.colors.value),patterns:splitList(f.patterns.value),installments:Number(f.installments.value||1),interest_free:f.interestFree.checked,status:f.status.value,is_launch:f.launch.checked,is_new:f.isNew.checked,featured:f.featured.checked,badge:f.badge.value.trim()||null,badge_style:f.tone.value}}
function renderPreview(){const p=currentDraft();const soldOut=p.status==='sold_out';ui.preview.classList.toggle('is-sold-out',soldOut);ui.preview.innerHTML=`<div class="preview-media">${ui.imagePreview.querySelector('img')?`<img src="${ui.imagePreview.querySelector('img').src}" alt="">`:''}${!soldOut&&(p.badge||p.is_launch||p.is_new)?`<span>${p.badge||(p.is_launch?'Lançamento':'Novo')}</span>`:''}${soldOut?`<div class="preview-sold-out"><strong>Esgotado</strong><small>Indisponível para compra no momento</small></div>`:''}</div><div><small>${labels[p.category]||'Categoria'}</small><strong>${p.name||'Nome da peça'}</strong><b>${money(p.price)}</b>${p.installments>1?`<em>${p.installments}x de ${money(p.price/p.installments)}${p.interest_free?' sem juros':''}</em>`:''}${soldOut?`<em class="preview-unavailable">Compra desativada enquanto estiver esgotado.</em>`:''}<p>${p.description||[...p.colors,...p.sizes,...p.patterns].join(' · ')}</p></div>`}
async function uniqueSlug(name,id){let base=slugify(name);let slug=base;let n=2;while(products.some(p=>p.slug===slug&&p.id!==id)){slug=`${base}-${n++}`}return slug}
async function uploadImage(file,productName){const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`products/${Date.now()}-${slugify(productName)}.${ext}`;const {error}=await db.storage.from('product-images').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;const {data}=db.storage.from('product-images').getPublicUrl(path);return{path,url:data.publicUrl}}

ui.form.addEventListener('submit',async e=>{e.preventDefault();if(!f.name.value.trim()||!f.category.value||!Number(f.price.value)){toast('Faltam dados','Preencha nome, categoria e valor.','error');return}const btn=$('#saveProduct');btn.disabled=true;ui.state.textContent='Salvando...';try{const draft=currentDraft();draft.slug=await uniqueSlug(draft.name,selected?.id);let oldPath=selected?.image_path||null;if(imageFile){const up=await uploadImage(imageFile,draft.name);draft.image_path=up.path;draft.image_url=up.url}else{draft.image_path=selected?.image_path||null;draft.image_url=selected?.image_url||null}
 if(selected?.id){const {data,error}=await db.from('products').update(draft).eq('id',selected.id).select().single();if(error)throw error;if(imageFile&&oldPath&&oldPath.startsWith('products/'))await db.storage.from('product-images').remove([oldPath]);selected=data}else{const {data,error}=await db.from('products').insert(draft).select().single();if(error)throw error;selected=data}
 await loadProducts();openEditor(products.find(p=>p.id===selected.id));toast('Salvo','A peça já está no catálogo do Supabase.');ui.state.textContent='Alterações salvas.'}catch(err){toast('Não foi possível salvar',err.message||String(err),'error');ui.state.textContent='Erro ao salvar.'}finally{btn.disabled=false}});

$('#newProduct').addEventListener('click',()=>openEditor());$('#emptyNewProduct').addEventListener('click',()=>openEditor());$('#cancelEdit').addEventListener('click',()=>{selected=null;ui.form.hidden=true;ui.empty.hidden=false;renderList()});
ui.list.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;openEditor(products.find(p=>p.id===b.dataset.id))});
ui.search.addEventListener('input',renderList);ui.filter.addEventListener('change',renderList);
ui.imageInput.addEventListener('change',()=>{imageFile=ui.imageInput.files?.[0]||null;if(!imageFile)return;ui.imageName.textContent=imageFile.name;const url=URL.createObjectURL(imageFile);renderImage(url);renderPreview()});
Object.values(f).forEach(el=>el?.addEventListener(el.type==='checkbox'||el.tagName==='SELECT'?'change':'input',renderPreview));
$('#duplicateProduct').addEventListener('click',()=>{if(!selected)return;const p={...selected,id:null,slug:null,name:`${selected.name} (cópia)`,image_path:null,image_url:selected.image_url};openEditor(p);selected=null;toast('Cópia criada','Ajuste os dados e salve como uma nova peça.')});
$('#deleteProduct').addEventListener('click',async()=>{if(!selected||!confirm(`Excluir ${selected.name}?`))return;try{if(selected.image_path?.startsWith('products/'))await db.storage.from('product-images').remove([selected.image_path]);const {error}=await db.from('products').delete().eq('id',selected.id);if(error)throw error;selected=null;ui.form.hidden=true;ui.empty.hidden=false;await loadProducts();toast('Excluído','A peça foi removida.')}catch(err){toast('Erro',err.message,'error')}});

(async()=>{
 // Na recarga, restaura a sessão salva e abre o painel automaticamente.
 const {data:{session},error}=await db.auth.getSession();
 if(error){showLogin(error.message);return}
 await showForSession(session);

 // Não executa consultas Supabase dentro do callback de Auth. Fazemos apenas
 // o tratamento de saída; login e restauração são tratados acima/submit.
 db.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_OUT') showLogin();
 });
})();
