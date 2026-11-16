# Builds art/rigs/: the cut layers, animations.json and small previews. Run from the repository root:
#   python3 tools/art/anim/build.py art/rigs
import sys, json, math, os; sys.path.insert(0, os.path.dirname(__file__))
import poses
from poses import *
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'; os.makedirs(OUT+'/previews',exist_ok=True)
def still(name):
    a=np.asarray(load(name)).copy(); return a
def ease(t): return 0.5-0.5*math.cos(math.pi*t)
def track(keys,t):
    """keys: [(time 0..1, value)], eased between."""
    for (t0,v0),(t1,v1) in zip(keys,keys[1:]):
        if t0<=t<=t1: return v0+(v1-v0)*ease((t-t0)/(t1-t0) if t1>t0 else 1)
    return keys[-1][1]
# Every animation: name, source pose, length in ms, and tracks. Angles in CSS terms (clockwise positive). y in percent of the picture's height (negative is up).
ANIMS=[
 dict(name='wag-proud', pose='proud', ms=2000, rig=True, tail=[(0,0),(.08,9),(.20,-3),(.32,9),(.44,-3),(.56,9),(.68,-3),(.80,9),(.92,0),(1,0)], y=[(0,0),(.06,-4),(.14,0),(1,0)]),
 dict(name='wag-happy', pose='happy', ms=2000, rig=True, tail=[(0,0),(.08,-9),(.20,8),(.32,-9),(.44,8),(.56,-9),(.68,8),(.80,-9),(.92,0),(1,0)], y=[(0,0),(.06,-4),(.14,0),(1,0)]),
 dict(name='hop-celebrating', pose='celebrating', ms=1400, sy=[(0,1),(.10,.92),(.28,1.05),(.44,.93),(.52,1),(.60,.93),(.76,1.04),(.90,.95),(1,1)], sx=[(0,1),(.10,1.06),(.28,.97),(.44,1.05),(.52,1),(.60,1.05),(.76,.98),(.90,1.03),(1,1)], y=[(0,0),(.10,0),(.28,-12),(.44,0),(.60,0),(.76,-8),(.90,0),(1,0)]),
 dict(name='trick-spin', pose='trick-spin', ms=1600, sx=[(0,1),(.14,.12),(.28,-1),(.42,.12),(.56,1),(.70,.12),(.84,-1),(.92,.12),(1,1)], y=[(0,0),(.14,-5),(.28,0),(.42,-5),(.56,0),(.70,-5),(.84,0),(1,0)]),
 dict(name='trick-roll-over', pose='trick-roll-over', ms=1800, origin='center', rot=[(0,0),(.18,-14),(.40,14),(.62,-10),(.82,8),(1,0)]),
 dict(name='trick-beg', pose='trick-beg', ms=1500, y=[(0,0),(.14,-6),(.28,0),(.42,-6),(.56,0),(.70,-6),(.84,0),(1,0)], sy=[(0,1),(.14,1.03),(.28,.97),(.42,1.03),(.56,.97),(.70,1.03),(.84,.98),(1,1)]),
 dict(name='trick-high-five', pose='trick-high-five', ms=1400, rot=[(0,0),(.20,6),(.36,0),(.56,6),(.72,0),(1,0)], y=[(0,0),(.20,-3),(.36,0),(.56,-3),(.72,0),(1,0)]),
 dict(name='trick-play-bow', pose='trick-play-bow', ms=1600, rot=[(0,0),(.20,5),(.40,-2),(.60,5),(.80,-2),(1,0)], sy=[(0,1),(.20,.96),(.40,1.02),(.60,.96),(.80,1.02),(1,1)]),
 dict(name='trick-fetch', pose='trick-fetch', ms=1400, y=[(0,0),(.12,-4),(.25,0),(.37,-4),(.50,0),(.62,-4),(.75,0),(.87,-4),(1,0)], rot=[(0,0),(.12,-2),(.25,2),(.37,-2),(.50,2),(.62,-2),(.75,2),(.87,-2),(1,0)]),
 dict(name='wave-hello', pose='hello', ms=1400, rot=[(0,0),(.16,5),(.34,-4),(.52,5),(.70,-4),(.86,2),(1,0)], y=[(0,0),(.08,-3),(.16,0),(1,0)]),
]
def frames(an, n=None, pad=80):
    name=an['pose']
    if an.get('rig'): src,base,layers=poses.rig(name); parts=RIGS[name]
    else: base=still(name); layers=[]; parts=[]
    H,W=base.shape[:2]; n=n or max(8,int(an['ms']/50)); out=[]
    for i in range(n):
        t=i/n
        tail=track(an['tail'],t) if 'tail' in an else 0
        out.append(compose(base,layers,parts,[-tail]*len(parts),dy=track(an.get('y',[(0,0),(1,0)]),t)/100*H,rot=-track(an.get('rot',[(0,0),(1,0)]),t),
                           sx=track(an.get('sx',[(0,1),(1,1)]),t),sy=track(an.get('sy',[(0,1),(1,1)]),t),pad=pad,origin=(W/2,H/2) if an.get('origin')=='center' else None))
    return out
if __name__=='__main__':
    report=[]; sheet=[]
    for an in ANIMS:
        fr=frames(an); gif([f.resize((f.width//2,f.height//2),Image.LANCZOS) for f in fr],f"{OUT}/previews/{an['name']}.gif",ms=50)
        c=clipped(fr); report.append((an['name'],len(fr),'CLIPPED' if c else 'ok'))
        assert not c, an['name']+': something is cut off'
    for r in report: print(*r)
    # rig layers and the spec
    spec=[]
    for an in ANIMS:
        d={k:v for k,v in an.items() if k not in('rig',)}
        if an.get('rig'):
            src,base,layers=poses.rig(an['pose']); os.makedirs(f"{OUT}/{an['pose']}",exist_ok=True)
            Image.fromarray(base).save(f"{OUT}/{an['pose']}/body.png",optimize=True); Image.fromarray(layers[0]).save(f"{OUT}/{an['pose']}/tail.png",optimize=True)
            p=RIGS[an['pose']][0]; H,W=base.shape[:2]
            d['layers']={'body':f"{an['pose']}/body.png",'tail':f"{an['pose']}/tail.png",'tailOrigin':f"{p['pivot'][0]/W*100:.1f}% {p['pivot'][1]/H*100:.1f}%",'size':[W,H]}
        spec.append(d)
    json.dump(spec,open(OUT+'/animations.json','w'),indent=1)
    for an in ANIMS:
        if an.get('rig'):
            src,base,layers=poses.rig(an['pose'])
            for k,v in an['tail']:
                g=holes(base,layers,RIGS[an['pose']],[-v]); assert g<25,(an['name'],v,g,'a gap opens at the joint')
    print('all checks passed')
