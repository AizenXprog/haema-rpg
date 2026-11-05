from collections import Counter
from itertools import product
from fractions import Fraction

f=lambda r:sum(map(int,r))/len(r)

def rolls(a,b): return list(product(range(1,a+1),range(1,b+1)))
def prob_atk(a,b,guard):return sum(x+y>=guard for x,y in rolls(a,b))/ (a*b)
def prob_crit(a,b,guard):return sum(x+y>=guard+3 and (x==a or y==b) for x,y in rolls(a,b))/(a*b)
def metus_cancel(a,b,m):return sum(x<z and y<z for x,y,z in product(range(1,a+1),range(1,b+1),range(1,m+1)))/(a*b*m)
def pr_success_met(a,b,m,dc):return sum(((x if x>=z else 0)+(y if y>=z else 0))>=dc for x,y,z in product(range(1,a+1),range(1,b+1),range(1,m+1)))/(a*b*m)
def ev_reaction(parry=False):
  # attack d6+d6 vs Guard7, target dest d6+acro d6, arm1, dmg d8 crit +2
  tot=0; hits=0; wounds=0; E=0
  for x,y,w,dx,dy,p in product(range(1,7),range(1,7),range(1,9),range(1,7),range(1,7),range(1,7)):
    attack=x+y>=7
    crit=attack and (x+y>=10) and (x==6 or y==6)
    dam = max(0,w-1+(2 if crit else 0)) if attack else 0
    if parry:dam=max(0,dam - p//2) if attack else 0
    else: dam=dam if dx+dy < x+y else 0
    tot+=dam
    hits+=dam>0
    wounds+=dam>=6
    E+=1
  return tot/E,hits/E,wounds/E

def chance_latebra(startdice, rerolls=0, searches=4, trials=50000, seed=42):
  import random
  r=random.Random(seed)
  successes=0
  for _ in range(trials):
    marks=[]
    for d in startdice:
      x=r.randrange(1,d+1)
      if x in marks and rerolls:
        for j in range(rerolls):
          x=r.randrange(1,d+1)
          if x not in marks:break
      if x not in marks:marks.append(x)
    found={r.randrange(1,7) for k in range(searches)}
    successes += set(marks).issubset(found)
  return successes/trials

if __name__=='__main__':
 print('hit,critical')
 for d in [4,6,8,10,12]:print(d,round(prob_atk(d,d,d+1)*100,2),round(prob_crit(d,d,d+1)*100,2))
 for d in (4,6,8):print('metus d6+ d6',d, 'zero', round(metus_cancel(6,6,d)*100,2),'DC7 success',round(pr_success_met(6,6,d,7)*100,2))
 print('Reactions esquiva',ev_reaction(False),'parry',ev_reaction(True))
 for dice,r in [([4,4],0),([6,6],1),([6,6,6],1),([6,6,6,6],2)]:print('latebra',dice,r,round(chance_latebra(dice,r,4)*100,2))

def exact_latebra(startdice,rerolls,searches):
 from collections import defaultdict
 from math import comb
 states={frozenset():1.0}
 for faces in startdice:
  after=defaultdict(float)
  for marks,prob in states.items():
   def roll(current,remaining,chance):
    for val in range(1,faces+1):
     if val in current and remaining>0:
      roll(current,remaining-1,chance/faces)
     else:
      after[current.union([val])]+=chance/faces
   roll(marks,rerolls,prob)
  states=after
 distribution=defaultdict(float)
 for k,p in states.items():distribution[len(k)]+=p
 chance=sum(p*sum((-1)**j*comb(k,j)*((6-j)/6)**searches for j in range(k+1)) for k,p in distribution.items())
 return dict(distribution),chance

if __name__=='__main__':
 for label,dices,re in [('d4',[4,4],0),('d6',[6,6],1),('d8',[6,6,6],1),('d10',[6,6,6],2),('d12',[6,6,6,6],2)]:
  dist,p=exact_latebra(dices,re,4)
  print(label,'dist', {k:round(v*100,2) for k,v in sorted(dist.items())},'P found 4 searches',round(p*100,4),'P found 10',round(exact_latebra(dices,re,10)[1]*100,4))
