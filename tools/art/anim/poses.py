import os, sys; sys.path.insert(0, os.path.dirname(__file__))
from rigtool import *
# One entry per pose that has a moving part. poly: the area the part lies in; seed: a point on the part;
# pivot: the joint it turns around; pin: how far from the joint the part also stays in the still picture, which hides the seam.
RIGS={
 'proud': [dict(id='tail',poly=[(0,205),(64,205),(64,262),(57,262),(57,340),(0,340)],seed=(25,270),pivot=(60,304),pin=22,feather=6)],
 'happy': [dict(id='tail',poly=[(0,60),(100,60),(100,140),(72,151),(60,157),(52,163),(46,170),(42,179),(39,193),(0,193)],seed=(25,140),pivot=(47,171),pin=20,feather=6)],
}
def rig(name):
    src,base,layers=cut(name,RIGS[name])
    for p in RIGS[name]: p['_orig']=np.asarray(src)[...,3]
    return src,base,layers
