# Cut a pose into a still base and moving parts ("pinned joint" method), and render previews.
# Each part is the connected piece of the drawing inside a polygon, around a seed point.
# The part's pixels close to its pivot ALSO stay in the still base, with a soft edge, so no gap can open at the joint.
import math, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
ART='art/puppy/'   # run from the repository root
BG=(243,246,251,255)
def load(name): return Image.open(ART+name+'.png').convert('RGBA')
def cut(name, parts):
    src=load(name); a=np.asarray(src).copy().astype(np.uint8); H,W=a.shape[:2]
    yy,xx=np.mgrid[0:H,0:W]; base=a.copy().astype(float); layers=[]
    for p in parts:
        pm=Image.new('L',(W,H),0); ImageDraw.Draw(pm).polygon(p['poly'],fill=255)
        m=(np.asarray(pm)>0)&(a[...,3]>0)
        lab,n=ndi.label(m); sx,sy=p['seed']; assert lab[sy,sx]>0,(name,p['id'],'seed not on the drawing')
        m=lab==lab[sy,sx]
        lay=np.zeros_like(a); lay[m]=a[m]
        d=np.hypot(xx-p['pivot'][0],yy-p['pivot'][1]); R=p['pin']; F=p.get('feather',5)
        keep=np.clip((R-d)/F,0,1)            # 1 near the pivot, fading to 0 at radius R
        base[...,3]=np.where(m, base[...,3]*keep, base[...,3])
        layers.append(lay); p['_mask']=m
    return src, base.astype(np.uint8), layers
def compose(base, layers, parts, angles, dx=0, dy=0, rot=0, sx=1.0, sy=1.0, pad=80, origin=None, bg=BG):
    H,W=base.shape[:2]
    def big(arr):
        b=Image.new('RGBA',(W+2*pad,H+2*pad),(0,0,0,0)); b.alpha_composite(Image.fromarray(arr),(pad,pad)); return b
    def rp(lay,p,ang): return big(lay).rotate(ang,resample=Image.BICUBIC,center=(p['pivot'][0]+pad,p['pivot'][1]+pad))
    c=Image.new('RGBA',(W+2*pad,H+2*pad),(0,0,0,0))
    for lay,p,ang in zip(layers,parts,angles):
        if not p.get('front'): c.alpha_composite(rp(lay,p,ang))
    c.alpha_composite(big(base))
    for lay,p,ang in zip(layers,parts,angles):
        if p.get('front'): c.alpha_composite(rp(lay,p,ang))
    ox,oy=(origin or (W/2,H)); ox+=pad; oy+=pad
    if sx!=1 or sy!=1:
        w2,h2=max(1,int(round(c.width*abs(sx)))),max(1,int(round(c.height*sy)))
        s=c.resize((w2,h2),Image.LANCZOS)
        if sx<0: s=s.transpose(Image.FLIP_LEFT_RIGHT)
        c2=Image.new('RGBA',c.size,(0,0,0,0)); c2.alpha_composite(s,(int(round(ox-ox*abs(sx))),int(round(oy-oy*sy)))); c=c2
    if rot: c=c.rotate(rot,resample=Image.BICUBIC,center=(ox,oy))
    out=Image.new('RGBA',c.size,bg); out.alpha_composite(c,(int(round(dx)),int(round(dy))))
    return out
def gif(frames, path, ms=45):
    fr=[f.convert('RGB') for f in frames]; fr[0].save(path,save_all=True,append_images=fr[1:],duration=ms,loop=0)
def clipped(frames):
    """True if any drawing touches the outer border of the preview canvas (something would be cut off)."""
    bgc=np.array(BG[:3])
    for f in frames:
        a=np.asarray(f.convert('RGB')).astype(int)
        edge=np.concatenate([a[:2].reshape(-1,3),a[-2:].reshape(-1,3),a[:,:2].reshape(-1,3),a[:,-2:].reshape(-1,3)])
        if (np.abs(edge-bgc).sum(1)>30).any(): return True
    return False
def holes(base, layers, parts, angles):
    """Pixels that were drawn in the original but are empty in this frame, close to a joint: a visible gap."""
    H,W=base.shape[:2]; f=compose(base,layers,parts,angles,pad=0,bg=(0,0,0,0)); al=np.asarray(f)[...,3]
    yy,xx=np.mgrid[0:H,0:W]; bad=0
    for p in parts:
        d=np.hypot(xx-p['pivot'][0],yy-p['pivot'][1])
        bad+=int(((d<p['pin'])&(p['_orig']>200)&(al<120)).sum())
    return bad
