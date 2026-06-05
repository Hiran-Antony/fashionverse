import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, ShoppingBag, Users, LogOut,
  Plus, Edit2, Trash2, X, Upload, ChevronDown, Search,
  Home as HomeIcon, Eye, Image as ImageIcon,
  Star, IndianRupee, ShoppingCart, Bell, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadImage, getOptimizedUrl } from '../lib/cloudinary';
import { useAuthStore } from '../store/authStore';
import { CATEGORIES, SIZES, ORDER_STATUSES, SUB_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'products' | 'orders' | 'customers';
interface SizeStock { size: string; stock: number; }
interface ColorEntry { color_name: string; hex_code: string; image_url: string; imageFile?: File; }
interface ProductForm {
  name: string; description: string; price: string; original_price: string;
  brand: string; category: string; sub_category: string; is_featured: boolean; is_trending: boolean;
  tags: string; sizes: SizeStock[]; colors: ColorEntry[];
}
const BLANK_FORM: ProductForm = {
  name:'',description:'',price:'',original_price:'',brand:'',
  category:'men',sub_category:'',is_featured:false,is_trending:false,tags:'',
  sizes:SIZES.map(s=>({size:s,stock:0})),colors:[],
};

// ── Sidebar nav items ─────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview'  as AdminTab, label: 'Overview',   icon: <LayoutDashboard size={17}/> },
  { id: 'products'  as AdminTab, label: 'Products',   icon: <Package size={17}/> },
  { id: 'orders'    as AdminTab, label: 'Orders',     icon: <ShoppingBag size={17}/> },
  { id: 'customers' as AdminTab, label: 'Users',      icon: <Users size={17}/> },
];

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({label,value,icon,sub,color}:{label:string;value:string|number;icon:React.ReactNode;sub?:string;color:string}) {
  return (
    <div style={{background:'white',border:'1px solid #ebebf5',borderRadius:20,padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)',position:'relative',overflow:'hidden',minWidth:0}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:color,opacity:0.1}}/>
      <div style={{width:44,height:44,borderRadius:14,background:color,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
        <span style={{color:'white'}}>{icon}</span>
      </div>
      <div style={{fontSize:26,fontWeight:900,color:'#0d0720',letterSpacing:'-0.03em',marginBottom:4,lineHeight:1}}>{value}</div>
      <div style={{fontSize:13,fontWeight:600,color:'#6b7280'}}>{label}</div>
      {sub && <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, profile, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme') || 'light';
    html.setAttribute('data-theme', 'light');
    return () => {
      html.setAttribute('data-theme', prev);
    };
  }, []);
  if (isLoading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0d0720'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid rgba(139,92,246,0.2)',borderTopColor:'#8b5cf6',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
          <p style={{color:'#6b5fa0',fontSize:13,fontWeight:600}}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f7f7fd',fontFamily:'var(--font-sans)'}}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{
        width:240,
        minWidth:240,
        background:'#faf5ff',
        borderRight: '1px solid #ede9fe',
        display:'flex',
        flexDirection:'column',
        position:'sticky',
        top:0,
        height:'100vh',
        overflowY:'auto',
        flexShrink:0,
      }}>
        {/* Brand */}
        <div style={{padding:'28px 20px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#8b5cf6,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:'white',flexShrink:0}}>FV</div>
            <div>
              <div style={{fontWeight:900,fontSize:14,color:'#4c1d95',letterSpacing:'-0.02em'}}>FashionVerse</div>
              <div style={{fontSize:9,fontWeight:700,color:'#d97706',textTransform:'uppercase',letterSpacing:'0.12em'}}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{height:1,background:'#ede9fe',margin:'0 16px 16px'}}/>

        {/* Nav */}
        <nav style={{flex:1,padding:'0 10px'}}>
          <div style={{fontSize:9,fontWeight:800,color:'#d97706',textTransform:'uppercase',letterSpacing:'0.15em',padding:'0 10px',marginBottom:10}}>Main Menu</div>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width:'100%',display:'flex',alignItems:'center',gap:12,padding:'11px 14px',
                borderRadius:12,marginBottom:4,background:active?'#ede9fe':'transparent',
                border:active?'1px solid #ddd6fe':'1px solid transparent',
                color:active?'#7c3aed':'#6b7280',fontSize:13,fontWeight:600,cursor:'pointer',
                textAlign:'left',transition:'all 0.15s',
              }}
              onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.color='#7c3aed';}}
              onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.color='#6b7280';}}
              >
                <span style={{color:active?'#8b5cf6':'#9ca3af'}}>{item.icon}</span>
                {item.label}
                {active && <ChevronRight size={12} style={{marginLeft:'auto',color:'#8b5cf6'}}/>}
              </button>
            );
          })}

          <div style={{height:1,background:'#ede9fe',margin:'14px 6px'}}/>
          <div style={{fontSize:9,fontWeight:800,color:'#d97706',textTransform:'uppercase',letterSpacing:'0.15em',padding:'0 10px',marginBottom:10}}>Store</div>
          <Link to="/" style={{
            display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:12,
            color:'#6b7280',fontSize:13,fontWeight:600,textDecoration:'none',transition:'color 0.15s',
          }}
          onMouseEnter={e=>(e.currentTarget.style.color='#7c3aed')}
          onMouseLeave={e=>(e.currentTarget.style.color='#6b7280')}
          >
            <HomeIcon size={17} style={{color:'#9ca3af'}}/> Back to Store
          </Link>
        </nav>

        {/* Profile card */}
        <div style={{margin:12,padding:14,background:'white',border:'1px solid #ede9fe',borderRadius:16,boxShadow:'0 4px 12px rgba(139,92,246,0.05)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:13,flexShrink:0}}>
              {profile?.name?.charAt(0)?.toUpperCase()||'A'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:'#0d0720',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{profile?.name||'Admin'}</div>
              <div style={{fontSize:10,color:'#6b7280',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.email}</div>
            </div>
          </div>
          <button onClick={async()=>{await supabase.auth.signOut();window.location.href='/';}} style={{
            width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            padding:'8px',borderRadius:10,background:'#fee2e2',border:'1px solid #fecaca',
            color:'#ef4444',fontSize:11,fontWeight:700,cursor:'pointer',
          }}>
            <LogOut size={12}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── CONTENT AREA ────────────────────────────────────── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'auto'}}>

        {/* Top bar */}
        <header style={{
          background:'rgba(247,247,253,0.95)',backdropFilter:'blur(16px)',
          borderBottom:'1px solid #ebebf5',padding:'16px 32px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          position:'sticky',top:0,zIndex:20,
        }}>
          <div>
            <div style={{fontSize:10,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:2}}>
              FashionVerse Admin
            </div>
            <div style={{fontSize:20,fontWeight:900,color:'#0d0720',letterSpacing:'-0.03em'}}>
              {activeTab==='overview'?'Dashboard Overview':activeTab==='products'?'Product Catalog':activeTab==='orders'?'Order Management':'User Management'}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button style={{width:38,height:38,borderRadius:12,background:'white',border:'1px solid #ebebf5',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Bell size={16} style={{color:'#6b7280'}}/>
            </button>
            <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:13}}>
              {profile?.name?.charAt(0)?.toUpperCase()||'A'}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main style={{flex:1,padding:'28px 32px'}}>
          <AnimatePresence mode="wait">
            {activeTab==='overview'  && <OverviewTab  key="overview"/>}
            {activeTab==='products'  && <ProductsTab  key="products"/>}
            {activeTab==='orders'    && <OrdersTab    key="orders"/>}
            {activeTab==='customers' && <CustomersTab key="customers"/>}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey:['admin-stats'],
    queryFn: async () => {
      const [products,orders,customers] = await Promise.all([
        supabase.from('products').select('id',{count:'exact',head:true}),
        supabase.from('orders').select('id,total_amount'),
        supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','customer'),
      ]);
      const revenue=(orders.data||[]).reduce((s,o)=>s+(o.total_amount||0),0);
      return {products:products.count??0,orders:orders.data?.length??0,revenue,customers:customers.count??0};
    },
    placeholderData:{products:0,orders:0,revenue:0,customers:0},
  });

  const { data: recentOrders=[] } = useQuery({
    queryKey:['admin-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id,total_amount,status,created_at,address,profiles(name)')
        .order('created_at',{ascending:false})
        .limit(6);
      return data||[];
    },
  });

  const STATS=[
    {label:'Total Revenue',   value:`₹${(stats?.revenue||0).toLocaleString()}`, icon:<IndianRupee size={20}/>, color:'#7c3aed', sub:'All-time earnings'},
    {label:'Total Orders',    value:stats?.orders||0,  icon:<ShoppingCart size={20}/>, color:'#2563eb', sub:'Customer orders'},
    {label:'Customers',       value:stats?.customers||0,icon:<Users size={20}/>,       color:'#059669', sub:'Registered users'},
    {label:'Active Products', value:stats?.products||0, icon:<Package size={20}/>,     color:'#d97706', sub:'In your catalog'},
  ];

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:24}}>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {STATS.map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}>
            <StatCard {...s}/>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{background:'white',border:'1px solid #ebebf5',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid #f5f5fb',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:'#0d0720'}}>Recent Orders</div>
            <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>Latest transactions from your store</div>
          </div>
          <span style={{fontSize:11,fontWeight:700,background:'#f3f0ff',color:'#7c3aed',padding:'4px 12px',borderRadius:999}}>{recentOrders.length} orders</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#fafafa',borderBottom:'1px solid #f5f5fb'}}>
                {['Order ID','Customer','Amount','Status','Date'].map(h=>(
                  <th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:10,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length===0?(
                <tr><td colSpan={5} style={{padding:'60px 20px',textAlign:'center',fontSize:13,color:'#9ca3af'}}>No orders yet</td></tr>
              ):(
                recentOrders.map((order:any, i:number)=>{
                  const st=ORDER_STATUSES.find(s=>s.value===order.status);
                  const totalOrders = stats?.orders || recentOrders.length;
                  const orderNum = 100 + totalOrders - i;
                  return (
                    <tr key={order.id} style={{borderBottom:'1px solid #fafafa'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#fafafa')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <td style={{padding:'14px 20px'}}>
                        <span style={{fontSize:13,fontWeight:800,color:'#7c3aed'}}>#{orderNum}</span>
                      </td>
                      <td style={{padding:'14px 20px',fontSize:13,fontWeight:600,color:'#0d0720'}}>{order.address?.name || (order as any).profiles?.name || 'Customer'}</td>
                      <td style={{padding:'14px 20px',fontSize:13,fontWeight:900,color:'#7c3aed'}}>₹{order.total_amount?.toLocaleString()}</td>
                      <td style={{padding:'14px 20px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:`${st?.color}18`,color:st?.color}}>{st?.label}</span>
                      </td>
                      <td style={{padding:'14px 20px',fontSize:12,color:'#9ca3af',whiteSpace:'nowrap'}}>
                        {new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Products ────────────────────────────────────────────────
function ProductsTab() {
  const qc=useQueryClient();
  const [showModal,setShowModal]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [form,setForm]=useState<ProductForm>({...BLANK_FORM,sizes:SIZES.map(s=>({size:s,stock:0}))});
  const [saving,setSaving]=useState(false);
  const [search,setSearch]=useState('');

  const { data:products=[],isLoading } = useQuery({
    queryKey:['admin-products'],
    queryFn: async()=>{
      const { data }=await supabase.from('products').select('*, product_colors(*), product_sizes(*)').order('created_at',{ascending:false});
      return data||[];
    },
  });

  const filtered=products.filter((p:any)=>
    p.name.toLowerCase().includes(search.toLowerCase())||(p.brand||'').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave=async()=>{
    if(!form.name||!form.price||!form.category){toast.error('Name, Price and Category are required');return;}
    if(form.colors.length===0){toast.error('Add at least one color with an image');return;}
    setSaving(true);
    try {
      const tagsArray = form.tags?form.tags.split(',').map(t=>t.trim()).filter(Boolean):[];
      if (form.sub_category && !tagsArray.includes(form.sub_category)) {
        tagsArray.push(form.sub_category);
      }

      const payload={
        name:form.name,description:form.description,price:parseFloat(form.price),
        original_price:form.original_price?parseFloat(form.original_price):null,
        brand:form.brand,category:form.category,is_featured:form.is_featured,is_trending:form.is_trending,
        tags:tagsArray,is_active:true,
      };
      let productId=editingId;
      if(editingId){
        await supabase.from('products').update(payload).eq('id',editingId);
      } else {
        const { data,error }=await supabase.from('products').insert(payload).select().single();
        if(error)throw error;
        productId=data.id;
      }
      if(!productId)throw new Error('No product ID');
      if(!editingId){
        const colorData=await Promise.all(form.colors.map(async c=>{
          let imageUrl=c.image_url;
          if(c.imageFile)imageUrl=await uploadImage(c.imageFile,'products');
          return{product_id:productId,color_name:c.color_name,hex_code:c.hex_code,image_url:imageUrl};
        }));
        await supabase.from('product_colors').insert(colorData);
        const sizeData=form.sizes.filter(s=>s.stock>0).map(s=>({product_id:productId,size:s.size,stock:s.stock,is_out_of_stock:false}));
        if(sizeData.length>0)await supabase.from('product_sizes').insert(sizeData);
      }
      toast.success(editingId?'Product updated!':'Product added! 🎉');
      qc.invalidateQueries({queryKey:['admin-products']});
      qc.invalidateQueries({queryKey:['products']});
      setShowModal(false);
      setForm({...BLANK_FORM,sizes:SIZES.map(s=>({size:s,stock:0}))});
      setEditingId(null);
    } catch(err:any){
      toast.error(err.message||'Failed to save');
    } finally {setSaving(false);}
  };

  const handleDelete=async(id:string)=>{
    if(!confirm('Delete this product? This cannot be undone.'))return;
    await supabase.from('products').delete().eq('id',id);
    toast.success('Product deleted');
    qc.invalidateQueries({queryKey:['admin-products']});
  };

  const addColor=()=>setForm(f=>({...f,colors:[...f.colors,{color_name:'',hex_code:'#8b5cf6',image_url:''}]}));
  const removeColor=(i:number)=>setForm(f=>({...f,colors:f.colors.filter((_,idx)=>idx!==i)}));

  // Input style helper
  const inp:React.CSSProperties={
    width:'100%',padding:'11px 14px',borderRadius:12,border:'1.5px solid #ebebf5',
    background:'#fafafa',color:'#0d0720',fontSize:13,outline:'none',boxSizing:'border-box',
  };

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{position:'relative',flex:1,maxWidth:360}}>
          <Search size={15} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or brand..."
            style={{...inp,paddingLeft:40,maxWidth:'100%'}}
            onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
        </div>
        <button onClick={()=>{setShowModal(true);setEditingId(null);setForm({...BLANK_FORM,sizes:SIZES.map(s=>({size:s,stock:0}))});}}
          style={{display:'flex',alignItems:'center',gap:8,padding:'11px 20px',borderRadius:12,background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'white',fontWeight:700,fontSize:13,border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(124,58,237,0.3)',whiteSpace:'nowrap',flexShrink:0}}>
          <Plus size={15}/> Add Product
        </button>
      </div>

      {/* Table */}
      <div style={{background:'white',border:'1px solid #ebebf5',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
        {isLoading?(
          <div style={{padding:'80px 0',display:'flex',justifyContent:'center'}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #f0f0f5',borderTopColor:'#8b5cf6',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ):filtered.length===0?(
          <div style={{padding:'80px 0',textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:18,background:'#f3f0ff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Package size={26} style={{color:'#8b5cf6'}}/>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:'#0d0720',marginBottom:6}}>No products yet</div>
            <div style={{fontSize:12,color:'#9ca3af'}}>Click "Add Product" to add your first item</div>
          </div>
        ):(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#fafafa',borderBottom:'1px solid #f5f5fb'}}>
                  {['Product','Brand','Category','Price','Stock','Labels','Actions'].map(h=>(
                    <th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:10,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p:any)=>{
                  const totalStock=(p.product_sizes||[]).reduce((s:number,sz:any)=>s+(sz.stock||0),0);
                  const img=p.product_colors?.[0]?.image_url;
                  const stockColor=totalStock>10?'#059669':totalStock>0?'#d97706':'#ef4444';
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid #fafafa',transition:'background 0.12s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#fafafa')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          {img?(
                            <img src={getOptimizedUrl(img,52)} alt={p.name} style={{width:44,height:52,borderRadius:10,objectFit:'cover',flexShrink:0}}/>
                          ):(
                            <div style={{width:44,height:52,borderRadius:10,background:'#f3f0ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <ImageIcon size={16} style={{color:'#8b5cf6'}}/>
                            </div>
                          )}
                          <div style={{fontSize:13,fontWeight:700,color:'#0d0720',maxWidth:180,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                        </div>
                      </td>
                      <td style={{padding:'14px 20px',fontSize:12,color:'#6b7280',fontWeight:600}}>{p.brand||'—'}</td>
                      <td style={{padding:'14px 20px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'#f5f5fb',color:'#6b7280',textTransform:'capitalize'}}>{p.category}</span>
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{fontSize:13,fontWeight:900,color:'#0d0720'}}>₹{p.price?.toLocaleString()}</div>
                        {p.original_price&&<div style={{fontSize:11,color:'#9ca3af',textDecoration:'line-through'}}>₹{p.original_price?.toLocaleString()}</div>}
                      </td>
                      <td style={{padding:'14px 20px',fontSize:13,fontWeight:700,color:stockColor}}>{totalStock} units</td>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {p.is_featured&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:999,background:'#fef3c7',color:'#92400e',fontWeight:700}}>New</span>}
                          {p.is_trending&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:999,background:'#ede9fe',color:'#5b21b6',fontWeight:700}}>Trending</span>}
                        </div>
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>{
                            setEditingId(p.id);
                            setForm({
                              name:p.name,description:p.description||'',price:String(p.price),original_price:String(p.original_price||''),
                              brand:p.brand||'',category:p.category,is_featured:p.is_featured,is_trending:p.is_trending,
                              tags:(p.tags||[]).join(', '),
                              sub_category: (p.tags||[]).find((t: string) => SUB_CATEGORIES[p.category]?.some(sc => sc.value === t)) || '',
                              sizes:SIZES.map(s=>{const f=(p.product_sizes||[]).find((ps:any)=>ps.size===s);return{size:s,stock:f?.stock||0};}),
                              colors:(p.product_colors||[]).map((c:any)=>({color_name:c.color_name,hex_code:c.hex_code||'#000',image_url:c.image_url})),
                            });
                            setShowModal(true);
                          }} style={{width:32,height:32,borderRadius:10,background:'#ede9fe',color:'#7c3aed',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={()=>handleDelete(p.id)} style={{width:32,height:32,borderRadius:10,background:'#fee2e2',color:'#ef4444',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal&&(
          <>
            <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>!saving&&setShowModal(false)}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)',zIndex:1000}}/>
            <motion.div key="md" initial={{opacity:0,scale:0.95,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              style={{position:'fixed',inset:0,zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
              <div style={{width:'100%',maxWidth:640,maxHeight:'90vh',overflowY:'auto',borderRadius:24,background:'white',boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}>
                {/* Header */}
                <div style={{position:'sticky',top:0,background:'white',padding:'22px 28px 18px',borderBottom:'1px solid #f5f5fb',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:10}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:900,color:'#0d0720'}}>{editingId?'Edit Product':'Add New Product'}</div>
                    <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>Fill in all details carefully before saving</div>
                  </div>
                  <button onClick={()=>!saving&&setShowModal(false)} style={{width:36,height:36,borderRadius:10,background:'#f5f5fb',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <X size={16} style={{color:'#6b7280'}}/>
                  </button>
                </div>

                <div style={{padding:28,display:'flex',flexDirection:'column',gap:28}}>
                  {/* Basic Info */}
                  <section>
                    <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Basic Information</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div style={{gridColumn:'1/-1'}}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Product Name *</label>
                        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Premium Slim Fit Oxford Shirt"
                          style={inp} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Brand Name *</label>
                        <input value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} placeholder="e.g. Louis Philippe"
                          style={inp} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Category *</label>
                        <div style={{position:'relative'}}>
                          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value,sub_category:''}))} style={{...inp,appearance:'none',paddingRight:36}}>
                            {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <ChevronDown size={13} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}}/>
                        </div>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Product Type</label>
                        <div style={{position:'relative'}}>
                          <select value={form.sub_category} onChange={e=>setForm(f=>({...f,sub_category:e.target.value}))} style={{...inp,appearance:'none',paddingRight:36}}>
                            <option value="">Select Type</option>
                            {(SUB_CATEGORIES[form.category]||[]).map(sc=><option key={sc.value} value={sc.value}>{sc.label}</option>)}
                          </select>
                          <ChevronDown size={13} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}}/>
                        </div>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Sale Price (₹) *</label>
                        <input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="1499" type="number"
                          style={inp} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Original MRP (₹)</label>
                        <input value={form.original_price} onChange={e=>setForm(f=>({...f,original_price:e.target.value}))} placeholder="2499" type="number"
                          style={inp} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                      <div style={{gridColumn:'1/-1'}}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Description</label>
                        <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the product..." rows={3}
                          style={{...inp,resize:'none'}} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                      <div style={{gridColumn:'1/-1'}}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Tags (comma separated)</label>
                        <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="casual, summer, cotton"
                          style={inp} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                      </div>
                    </div>
                  </section>

                  {/* Labels */}
                  <section>
                    <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Labels</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      {[{key:'is_featured' as const,label:'⭐ New Arrival',desc:'Shows in New Arrivals section'},{key:'is_trending' as const,label:'🔥 Trending',desc:'Shows in Trending section'}].map(({key,label,desc})=>(
                        <label key={key} style={{display:'flex',alignItems:'center',gap:12,padding:14,borderRadius:14,cursor:'pointer',border:`1.5px solid ${form[key]?'#8b5cf6':'#ebebf5'}`,background:form[key]?'#faf8ff':'#fafafa',transition:'all 0.15s'}}>
                          <input type="checkbox" checked={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} style={{width:16,height:16,accentColor:'#7c3aed'}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:'#0d0720'}}>{label}</div>
                            <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Stock */}
                  <section>
                    <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Stock Quantity Per Size</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                      {form.sizes.map((s,i)=>(
                        <div key={s.size} style={{textAlign:'center'}}>
                          <div style={{fontSize:11,fontWeight:800,marginBottom:8,padding:'4px 8px',borderRadius:8,background:s.stock>0?'#ede9fe':'#f5f5fb',color:s.stock>0?'#7c3aed':'#9ca3af',display:'inline-block'}}>{s.size}</div>
                          <input type="number" min="0" value={s.stock}
                            onChange={e=>{const n=[...form.sizes];n[i]={...n[i],stock:parseInt(e.target.value)||0};setForm(f=>({...f,sizes:n}));}}
                            style={{...inp,textAlign:'center',padding:'10px 4px'}}
                            onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                        </div>
                      ))}
                    </div>
                    <p style={{fontSize:11,color:'#9ca3af',marginTop:10}}>💡 Set 0 for sizes you don't carry. Stock auto-decreases when customers order.</p>
                  </section>

                  {/* Colors */}
                  <section>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                      <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em'}}>Colors & Images</div>
                      <button type="button" onClick={addColor} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,background:'#ede9fe',color:'#7c3aed',border:'none',cursor:'pointer',fontSize:12,fontWeight:700}}>
                        <Plus size={12}/> Add Color
                      </button>
                    </div>
                    {form.colors.length===0?(
                      <div style={{borderRadius:16,border:'2px dashed #ebebf5',padding:'40px 0',textAlign:'center'}}>
                        <Upload size={24} style={{color:'#9ca3af',margin:'0 auto 8px',display:'block'}}/>
                        <div style={{fontSize:13,fontWeight:600,color:'#6b7280'}}>No colors added</div>
                        <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>Click "Add Color" to upload product photos</div>
                      </div>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                        {form.colors.map((c,i)=>(
                          <div key={i} style={{display:'flex',gap:14,padding:14,borderRadius:16,background:'#fafafa',border:'1px solid #ebebf5'}}>
                            <div onClick={()=>document.getElementById(`cimg-${i}`)?.click()}
                              style={{width:70,height:84,borderRadius:14,overflow:'hidden',flexShrink:0,cursor:'pointer',border:'2px dashed #e0e0ee',display:'flex',alignItems:'center',justifyContent:'center',background:'white'}}>
                              {c.image_url?<img src={c.image_url} alt="color" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(
                                <div style={{textAlign:'center'}}>
                                  <Upload size={16} style={{color:'#9ca3af',margin:'0 auto 4px',display:'block'}}/>
                                  <span style={{fontSize:9,color:'#9ca3af'}}>Upload</span>
                                </div>
                              )}
                              <input id={`cimg-${i}`} type="file" accept="image/*" style={{display:'none'}}
                                onChange={e=>{if(e.target.files?.[0]){const file=e.target.files[0];const n=[...form.colors];n[i]={...n[i],imageFile:file,image_url:URL.createObjectURL(file)};setForm(f=>({...f,colors:n}));}}}/>
                            </div>
                            <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
                              <div>
                                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',marginBottom:5}}>Color Name</label>
                                <input value={c.color_name} onChange={e=>{const n=[...form.colors];n[i]={...n[i],color_name:e.target.value};setForm(f=>({...f,colors:n}));}} placeholder="e.g. Midnight Blue"
                                  style={{...inp,padding:'9px 12px',fontSize:12}} onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <input type="color" value={c.hex_code} onChange={e=>{const n=[...form.colors];n[i]={...n[i],hex_code:e.target.value};setForm(f=>({...f,colors:n}));}}
                                  style={{width:38,height:38,borderRadius:10,border:'1.5px solid #ebebf5',cursor:'pointer',padding:2,background:'white'}}/>
                                <span style={{fontSize:11,fontFamily:'monospace',color:'#6b7280'}}>{c.hex_code}</span>
                              </div>
                            </div>
                            <button onClick={()=>removeColor(i)} style={{width:28,height:28,borderRadius:8,background:'#fee2e2',color:'#ef4444',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,alignSelf:'flex-start'}}>
                              <X size={12}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Footer */}
                <div style={{position:'sticky',bottom:0,background:'white',padding:'16px 28px',borderTop:'1px solid #f5f5fb',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:10}}>
                  <button onClick={()=>!saving&&setShowModal(false)} disabled={saving}
                    style={{padding:'10px 20px',borderRadius:12,background:'#f5f5fb',color:'#6b7280',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'10px 24px',borderRadius:12,background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#a855f7)',color:'white',fontWeight:700,fontSize:13,border:'none',cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 14px rgba(124,58,237,0.3)'}}>
                    {saving?<><div style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',animation:'spin 0.8s linear infinite'}}/>Saving...</>:editingId?'Update Product':'Add Product'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Orders ──────────────────────────────────────────────────
function AdminOrderCard({
  order,
  orderNum,
  isExpanded,
  onToggle,
  onStatusChange,
}: {
  order: any;
  orderNum: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: string) => void;
}) {
  const st = ORDER_STATUSES.find((s) => s.value === order.status);
  const customerName = order.address?.name || order.profiles?.name || 'Customer';
  const customerEmail = order.profiles?.email || order.address?.phone || '';

  return (
    <div
      style={{
        width: '100%',
        background: 'white',
        border: '1px solid #ebebf5',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #faf5ff 0%, #fffbeb 100%)',
          borderBottom: '1px solid #ebebf5',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Order ID</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed' }}>#{orderNum}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {customerName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0720', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerName}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerEmail}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Amount</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>₹{order.total_amount?.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Items</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0720' }}>{order.order_items?.length || 0}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Status</div>
          <select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{ fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${st?.color}40`, outline: 'none', cursor: 'pointer', background: `${st?.color}18`, color: st?.color, width: '100%', maxWidth: 180 }}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Date</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: isExpanded ? '#ede9fe' : '#f5f5fb', color: isExpanded ? '#7c3aed' : '#6b7280', flexShrink: 0 }}
          >
            <Eye size={14} />{isExpanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '1px solid #ebebf5' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Order Items</div>
          {(order.order_items || []).length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', padding: '8px 0' }}>No items data available</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
              {(order.order_items || []).map((item: any) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: '1px solid #ebebf5', borderRadius: 14 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0720' }}>{item.products?.name || 'Product'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {[item.color_name, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#7c3aed', flexShrink: 0 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
          {order.address && (
            <div style={{ padding: '16px 18px', background: 'white', border: '1px solid #ebebf5', borderRadius: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Delivery Address</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{order.address.name} · {order.address.phone}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(name,email), order_items(*, products(name))')
        .order('created_at', { ascending: true });
      if (error) {
        const { data: fallback } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name))')
          .order('created_at', { ascending: true });
        return (fallback || []).reverse();
      }
      return (data || []).reverse();
    },
  });

  const getCustomerName = (order: any) =>
    order.address?.name || order.profiles?.name || 'Customer';

  const filtered = orders.filter((o: any) => {
    const name = getCustomerName(o).toLowerCase();
    const q = search.toLowerCase();
    return q === '' || name.includes(q);
  });

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success('Status updated');
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid #ebebf5', background: 'white', color: '#0d0720', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
            onBlur={(e) => (e.target.style.borderColor = '#ebebf5')}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, background: 'white', border: '1px solid #ebebf5', color: '#6b7280' }}>
          {filtered.length} orders
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #f0f0f5', borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', background: 'white', border: '1px solid #ebebf5', borderRadius: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#f3f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShoppingBag size={26} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0720' }}>No orders yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {filtered.map((order: any) => {
            const orderNum = orders.length - orders.indexOf(order) + 100;
            return (
              <AdminOrderCard
                key={order.id}
                order={order}
                orderNum={orderNum}
                isExpanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                onStatusChange={(status) => updateStatus(order.id, status)}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Customers ───────────────────────────────────────────────
function CustomersTab() {
  const qc = useQueryClient();
  const [search,setSearch]=useState('');

  const { data:customers=[],isLoading } = useQuery({
    queryKey:['admin-customers'],
    queryFn: async()=>{
      // Also fetch orders with address so we can get real checkout names
      const { data }=await supabase
        .from('profiles')
        .select('*, orders(id, total_amount, address)')
        .order('created_at',{ascending:false});
      return data||[];
    },
  });

  // Get the best display name: prefer checkout address name over profile username
  const getDisplayName = (c:any) => {
    // Check if any of their orders has a real name in address
    const addressName = (c.orders||[]).map((o:any)=>o.address?.name).find((n:string)=>n&&n.length>1);
    return addressName || c.name || 'Customer';
  };

  const getPhone = (c:any) => {
    const addressPhone = (c.orders||[]).map((o:any)=>o.address?.phone).find((p:string)=>p&&p.length>5);
    return addressPhone || c.phone || '—';
  };

  const makeAdmin=async(id:string, name:string, isCurrentlyAdmin:boolean)=>{
    const newRole = isCurrentlyAdmin ? 'customer' : 'admin';
    const msg = isCurrentlyAdmin 
      ? `Are you sure you want to remove ${name} as an Admin? They will lose access to this dashboard.`
      : `Are you sure you want to make ${name} an Admin? They will have full access to this dashboard.`;
      
    if(!confirm(msg))return;
    const {error}=await supabase.from('profiles').update({role:newRole}).eq('id',id);
    if(error) toast.error('Failed to update role');
    else {
      toast.success(isCurrentlyAdmin ? `${name} is no longer an Admin.` : `${name} is now an Admin!`);
      qc.invalidateQueries({queryKey:['admin-customers']});
    }
  };

  const filtered=customers.filter((c:any)=>{
    const display=getDisplayName(c).toLowerCase();
    const q=search.toLowerCase();
    return q===''||display.includes(q)||(c.name||'').toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{position:'relative',flex:1,maxWidth:360}}>
          <Search size={15} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
            style={{width:'100%',padding:'11px 14px 11px 40px',borderRadius:12,border:'1.5px solid #ebebf5',background:'white',color:'#0d0720',fontSize:13,outline:'none',boxSizing:'border-box'}}
            onFocus={e=>(e.target.style.borderColor='#8b5cf6')} onBlur={e=>(e.target.style.borderColor='#ebebf5')}/>
        </div>
        <span style={{fontSize:12,fontWeight:700,padding:'8px 16px',borderRadius:10,background:'white',border:'1px solid #ebebf5',color:'#6b7280'}}>{filtered.filter((c:any)=>c.role==='admin').length} Admins</span>
        <span style={{fontSize:12,fontWeight:700,padding:'8px 16px',borderRadius:10,background:'white',border:'1px solid #ebebf5',color:'#6b7280'}}>{filtered.filter((c:any)=>c.role!=='admin').length} Customers</span>
      </div>

      <div style={{background:'white',border:'1px solid #ebebf5',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
        {isLoading?(
          <div style={{padding:'80px 0',display:'flex',justifyContent:'center'}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #f0f0f5',borderTopColor:'#8b5cf6',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ):filtered.length===0?(
          <div style={{padding:'80px 0',textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:18,background:'#f3f0ff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><Users size={26} style={{color:'#8b5cf6'}}/></div>
            <div style={{fontSize:14,fontWeight:700,color:'#0d0720'}}>No users yet</div>
          </div>
        ):(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#fafafa',borderBottom:'1px solid #f5f5fb'}}>
                  {['User','Phone','Total Spent','Orders','Loyalty Points','Joined','Actions'].map(h=>(
                    <th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:10,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c:any)=>{
                  const totalSpent=(c.orders||[]).reduce((s:number,o:any)=>s+(o.total_amount||0),0);
                  const displayName = getDisplayName(c);
                  return (
                    <tr key={c.id} style={{borderBottom:'1px solid #fafafa',transition:'background 0.12s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#fafafa')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:14,flexShrink:0}}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{fontSize:13,fontWeight:700,color:'#0d0720'}}>{displayName}</div>
                              {c.role==='admin' && (
                                <span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:4,background:'#ede9fe',color:'#7c3aed',letterSpacing:'0.05em'}}>ADMIN</span>
                              )}
                            </div>
                            <div style={{fontSize:10,color:'#9ca3af'}}>{c.email||'—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'14px 20px',fontSize:12,color:'#6b7280'}}>{getPhone(c)}</td>
                      <td style={{padding:'14px 20px',fontSize:13,fontWeight:900,color:totalSpent>0?'#7c3aed':'#9ca3af'}}>
                        {totalSpent>0?`₹${totalSpent.toLocaleString()}`:'—'}
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <span style={{fontSize:13,fontWeight:700,color:'#0d0720'}}>{c.orders?.length||0}</span>
                        <span style={{fontSize:11,color:'#9ca3af',marginLeft:4}}>orders</span>
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,color:'#d97706'}}>
                          <Star size={12} fill="currentColor"/>{c.loyalty_points||0} pts
                        </span>
                      </td>
                      <td style={{padding:'14px 20px',fontSize:12,color:'#9ca3af',whiteSpace:'nowrap'}}>
                        {new Date(c.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <button onClick={()=>makeAdmin(c.id, displayName, c.role==='admin')} style={{padding:'6px 12px',borderRadius:8,background:c.role==='admin'?'#fee2e2':'#ede9fe',color:c.role==='admin'?'#ef4444':'#7c3aed',fontWeight:700,fontSize:11,border:'none',cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                          {c.role==='admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
