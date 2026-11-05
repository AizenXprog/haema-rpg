"""HÆMA 0.1 — simulação reproduzível da disputa Latebra + Metus.

Uma pessoa já escondida precisa obter 2 sucessos (Intelecto d6 +
Ladinagem d8, CD7) em até 6 rodadas; um perseguidor faz Busca Intensiva
com dois d6 por rodada. O jogador age antes do perseguidor, sem movimento.
Falha no objetivo produz Ruído Leve (+1 busca naquela rodada).
Ações de reforço acrescentam nova marca d6 se não duplicada/descoberta.
A versão com Metus já começa afetada (não testa a resistência inicial),
e o medo persiste pelas seis rodadas (não usa ação para recuperar).
Esta NÃO é uma simulação de uma sessão completa com 5 personagens.
"""
from collections import defaultdict
import random


def create_latebra(r,metus=0):
    marks=[]
    for i in range(3):
        face=r.randint(1,6)
        if face in marks:face=r.randint(1,6)
        if i==2 and metus and face < r.randint(1,metus):
            continue
        if face not in marks: marks.append(face)
    return set(marks)


def skill_test(r,metus=0):
    a=r.randint(1,6);s=r.randint(1,8)
    if metus:
        z=r.randint(1,metus)
        if a<z:a=0
        if s<z:s=0
    return a+s>=7


def simulate(r,metus=0,policy='objetivo',rounds=6):
    marks=create_latebra(r,metus);found=set()
    finished=0;reinforcements=0
    for rd in range(1,rounds+1):
        remaining=marks-found
        should_reinforce=(policy=='reforcar_quando_fraco' and len(remaining)<=1
                          and len(remaining)<4)
        if policy=='reforcar_primeiro' and rd==1:should_reinforce=True
        noisy=False
        if should_reinforce:
            reinforcements+=1
            mark=r.randint(1,6)
            if not metus or mark>=r.randint(1,metus):
                if mark not in marks and mark not in found and len(remaining)<4:
                    marks.add(mark)
        else:
            success=skill_test(r,metus)
            finished+=bool(success)
            noisy=not success
            if finished>=2:return (True,rd,reinforcements)
        for _ in range(2+int(noisy)):
            roll=r.randint(1,6)
            if roll in marks:found.add(roll)
        if len(marks-found)==0:return (False,rd,reinforcements)
    return (False,rounds,reinforcements)


def run(trials=20000,seed=20261105):
    for met in [0,4,6,8]:
        for i,pol in enumerate(['objetivo','reforcar_primeiro','reforcar_quando_fraco']):
            r=random.Random(seed+met*100+i)
            results=[simulate(r,met,pol) for _ in range(trials)]
            success=sum(x[0] for x in results)/trials
            reinforced=sum(x[2] for x in results)/trials
            print(f'Metus={"sem" if met==0 else "d"+str(met)}'
                  f' | politica={pol} | sucesso_em_6_rodadas={success:.1%}'
                  f' | reforcos_medios={reinforced:.2f}')

if __name__=='__main__':run()

# Isola o objetivo oposto: sobreviver oculto durante cinco rodadas.
def survival(r,metus=0,reinforce=False,rounds=5):
    marks=create_latebra(r,metus);found=set()
    for rd in range(rounds):
        if reinforce and len(marks-found)<4:
            m=r.randint(1,6)
            if (not metus or m>=r.randint(1,metus)) and m not in marks:
                marks.add(m)
        for _ in range(2):
            n=r.randint(1,6)
            if n in marks:found.add(n)
        if not (marks-found):return False
    return True

if __name__=='__main__':
    print('\nCenario alternativo: sobreviver escondido por cinco rodadas')
    for met in [0,4,6,8]:
        for reinforce in [False,True]:
            rng=random.Random(512+met*2+int(reinforce))
            n=20000
            success=sum(survival(rng,met,reinforce) for _ in range(n))/n
            print(f'Metus={"sem" if met==0 else "d"+str(met)} | reforcar={reinforce} | sobrevive_oculto={success:.1%}')
