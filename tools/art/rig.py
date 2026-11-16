import numpy as np, math
from PIL import Image
from scipy import ndimage as ndi
src=Image.open('art/puppy/proud.png').convert('RGBA'); a=np.asarray(src).copy(); H,W=a.shape[:2]
yy,xx=np.mgrid[0:H,0:W]
region=(yy>205)&(((yy<262)&(xx<63))|((yy>=262)&(xx<59)))
tailm=region&(a[...,3]>0)
tail=np.zeros_like(a); tail[tailm]=a[tailm]
body=a.copy(); body[tailm]=0
# extend the tail base to the right, under the body, so no gap opens when it swings
EXT=26
for y in range(H):
    xs=np.where(tailm[y])[0]
    if len(xs) and xs.max()>=57 and y>=284:
        col=tail[y,xs.max()-1].copy()
        tail[y,xs.max():min(W,xs.max()+EXT)]=col
Image.fromarray(tail).save('art/rigs/proud/tail.png'); Image.fromarray(body).save('art/rigs/proud/body.png')
PIV=(60,306)
def frame(deg, bob=0, S=1, pad=46):
    t=Image.fromarray(tail).rotate(deg,resample=Image.BICUBIC,center=PIV)
    c=Image.new('RGBA',(W+2*pad,H+2*pad),(243,246,251,255))
    c.alpha_composite(t,(pad,pad+bob)); c.alpha_composite(Image.fromarray(body),(pad,pad+bob))
    return c.resize((c.width*S,c.height*S),Image.LANCZOS)
if __name__=='__main__':
    N=16; fr=[]
    for i in range(N):
        ph=2*math.pi*i/N
        fr.append(frame(4+13*math.sin(ph), bob=round(-1.5*abs(math.sin(ph)))).convert('RGB'))
    fr[0].save('art/rigs/proud/preview.gif',save_all=True,append_images=fr[1:],duration=45,loop=0)
