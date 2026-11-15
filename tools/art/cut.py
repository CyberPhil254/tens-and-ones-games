# Cut the sheets in art/source/ into separate transparent PNGs in art/.
# Run from the repo root: python3 tools/art/cut.py  (needs Pillow, numpy, scipy)
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
U='art/source/%s.jpg'
def cut(src, names, outdir, rows, cols, drop_text=False):
    im=Image.open(U%src).convert('RGB'); a=np.asarray(im).astype(int)
    mn=a.min(2); mx=a.max(2)
    cand=(mn>198)&((mx-mn)<20)                      # white or light grey grid line
    lab,n=ndi.label(cand)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))
    # white pockets closed in by the drawing (between legs, inside handles) are background too
    pure=(mn>238)&((mx-mn)<14)&~bg
    pl,pn=ndi.label(pure)
    if pn:
        ps=ndi.sum(pure,pl,range(1,pn+1))
        pockets=np.isin(pl,[i+1 for i,v in enumerate(ps) if v>260])
    else: pockets=np.zeros_like(bg)
    fg=ndi.binary_opening(~bg,iterations=1)
    H,W=fg.shape; ch,cw=H/rows,W/cols
    l2,k=ndi.label(ndi.binary_dilation(fg,iterations=7))
    sizes=ndi.sum(fg,l2,range(1,k+1)); objs=ndi.find_objects(l2); cms=ndi.center_of_mass(fg,l2,range(1,k+1))
    os.makedirs(outdir,exist_ok=True); out=[]
    for i,name in enumerate(names):
        if not name: continue
        r,c=divmod(i,cols)
        mine=[j for j in range(k) if sizes[j]>0 and int(cms[j][0]//ch)==r and int(cms[j][1]//cw)==c]
        if not mine: print('EMPTY',name); continue
        big=max(sizes[j] for j in mine); keep=np.zeros_like(fg)
        for j in mine:
            sl=objs[j]; h=sl[0].stop-sl[0].start
            if sizes[j]<big*0.004: continue
            if drop_text and h<70 and sizes[j]<big*0.25 and cms[j][0]>(r+0.72)*ch: continue
            keep|=(l2==j+1)&fg
        ys,xs=np.where(keep); pad=6
        b0,b1=max(ys.min()-pad,0),min(ys.max()+pad+1,H); c0,c1=max(xs.min()-pad,0),min(xs.max()+pad+1,W)
        alpha=(~bg)&ndi.binary_dilation(keep,iterations=2)
        if name not in WHITE_OK: alpha&=~pockets
        al=ndi.gaussian_filter(alpha.astype(float),0.7); al=np.clip((al-0.35)/0.5,0,1)
        rgba=np.dstack([a,(al*255)]).astype('uint8')[b0:b1,c0:c1]
        Image.fromarray(rgba,'RGBA').save(f'{outdir}/{name}.png',optimize=True)
        out.append((name,rgba.shape[1],rgba.shape[0]))
    return out
WHITE_OK={'zebra'}
J=[
 ('01-poses',['standing','happy','celebrating','','encouraging','sleeping'],'puppy',2,3,False),
 ('02-reactions',['thinking','not-yet','pointing','','proud','head'],'puppy',2,3,False),
 ('06-states',['hello','goodbye','digging','sniffing','gift','yawning'],'puppy',2,3,False),
 ('03-tricks',['trick-beg','trick-high-five','trick-roll-over','trick-play-bow','trick-spin','trick-fetch'],'puppy',2,3,True),
 ('07-with-treasures',['with-bandana','with-bed','with-bowl','with-kennel','with-rope-toy','with-ball'],'puppy',2,3,False),
 ('04-props',['bed','ball','bowl','bandana','kennel','rope-toy','stepping-stone','signpost','bush'],'props',3,3,False),
 ('09-awards',['medal','trophy','rosette','paw-badge','crown','shield','','','paw-shield'],'awards',3,3,False),
 ('10-fixes',['listening','not-yet','trick-spin','with-bowl'],'puppy',2,2,False),   # replaces the weak first versions
 ('08-friends',['kitten','bunny','elephant','lion','giraffe','monkey','zebra','hippo','owl'],'friends',3,3,False),
]
for src,names,d,r,c,t in J:
    for n,w,h in cut(src,names,'art/'+d,r,c,t): print(d,n,w,h)
