"""HÆMA 0.1 — confronto simplificado reproduzível, NÃO substitui playtest humano.

Cenário: cinco personagens iniciais vs. três adversários treinados.
Decisões fixadas para poder reproduzir resultados:
- Foco no inimigo vivo com menos Integridade (ambos os lados).
- Uma reação por rodada e Fôlego para pagar.
- Sem cobertura, Metus, Latebra, cura, Ímpeto ou movimento tático.
- Não há morte; incapacitado não age. Rodada termina quando todos agem.
- Alternância simples de turnos e iniciativa 1d6 por lado.
- Políticas: 'atacar' ou 'apoio' (investigador usa Criar Abertura).
"""
from dataclasses import dataclass, replace
from statistics import mean, median
import random

@dataclass
class Actor:
    name: str
    side: str
    attack_a: int
    attack_b: int
    damage_faces: int
    defense: int
    armor: int
    hp: int
    hp_max: int
    stamina: int
    stamina_max: int
    defense_a: int
    defense_b: int
    parry_die: int
    defense_kind: str
    reacted: bool = False
    wounds: int = 0


def die(rng, n): return rng.randint(1, n)


def actors(enemy_count=3):
    p = [
        Actor('Combatente','P',8,8,8,7,1,18,18,9,9,6,6,8,'parry'),
        Actor('Atirador','P',8,8,8,7,1,16,16,8,8,8,4,4,'dodge'),
        Actor('Infiltrador','P',8,4,4,7,1,16,16,8,8,8,6,4,'dodge'),
        Actor('Investigador','P',4,4,6,7,1,16,16,8,8,4,4,4,'dodge'),
        Actor('Medico','P',6,4,4,7,1,18,18,9,9,6,4,4,'dodge'),
    ]
    e=[Actor(f'Treinado {i+1}','E',6,6,6,7,1,10,10,6,6,6,6,6,'parry') for i in range(enemy_count)]
    return p,e


def attack(r,att,defender,extra_die=False):
    x=die(r,att.attack_a); y=die(r,att.attack_b)
    full=x+y+(die(r,6) if extra_die else 0)
    if full<defender.defense:return 0
    critical=(x==att.attack_a or y==att.attack_b) and (x+y>=defender.defense+3)
    dmg=die(r,att.damage_faces)+(2 if critical else 0)
    # Dodge compares against the complete attack including opening die.
    if not defender.reacted and defender.stamina>=1:
        defender.reacted=True; defender.stamina-=1
        if defender.defense_kind=='dodge':
            if die(r,defender.defense_a)+die(r,defender.defense_b)>=full: return 0
        else:
            dmg-=die(r,defender.parry_die)//2
    dmg=max(0,dmg-defender.armor)
    defender.hp=max(0,defender.hp-dmg)
    if dmg>= (defender.hp_max+2)//3:
        if defender.wounds<2:
            defender.wounds+=1
            defender.stamina_max-=1
            defender.stamina=min(defender.stamina,defender.stamina_max)
    return dmg


def fight(r,policy,enemy_count=3):
    players,enemies=actors(enemy_count)
    p_init=die(r,6); e_init=die(r,6)
    while p_init==e_init:
        p_init=die(r,6); e_init=die(r,6)
    first='P' if p_init>e_init else 'E'
    opening_target=None
    for turn in range(1,31):
        for a in players+enemies:a.reacted=False
        pp=[a for a in players if a.hp>0];ee=[a for a in enemies if a.hp>0]
        if not pp or not ee:break
        # No actor appears twice: alternate turns until both sides are exhausted.
        p_iter=iter(r.sample(pp,len(pp)));e_iter=iter(r.sample(ee,len(ee)))
        order=[]
        while len(order)<len(pp)+len(ee):
            for side in ([first,'E' if first=='P' else 'P']):
                try:order.append(next(p_iter if side=='P' else e_iter))
                except StopIteration:pass
        for a in order:
            if a.hp<=0:continue
            targets=enemies if a.side=='P' else players
            alive=[x for x in targets if x.hp>0]
            if not alive:break
            if policy=='apoio' and a.name=='Investigador':
                opening_target=min(alive,key=lambda x:(x.hp,x.name))
                continue
            target=min(alive,key=lambda x:(x.hp,x.name))
            uses_opening=(a.side=='P' and target is opening_target)
            attack(r,a,target,extra_die=uses_opening)
            if uses_opening: opening_target=None
        if not any(e.hp>0 for e in enemies) or not any(p.hp>0 for p in players):break
    return dict(win=any(p.hp>0 for p in players) and not any(e.hp>0 for e in enemies),
                rounds=turn,down=sum(p.hp<=0 for p in players),capped=turn>=30)


def run(trials=4000,seed=20261105):
    for enemy_count in [2,3,4,5]:
      for i,policy in enumerate(['atacar','apoio']):
        rng=random.Random(seed+100*enemy_count+i)
        cases=[fight(rng,policy,enemy_count) for _ in range(trials)]
        wins=sum(x['win'] for x in cases)/trials
        print(f'inimigos={enemy_count} | politica={policy} | confrontos={trials} | vitorias={wins:.1%} | '
              f'rodadas_media={mean(x["rounds"] for x in cases):.2f} | '
              f'rodadas_mediana={median(x["rounds"] for x in cases):g} | '
              f'personagens_incapacitados_media={mean(x["down"] for x in cases):.2f} | '
              f'limite30={sum(x["capped"] for x in cases)/trials:.1%}')

if __name__=='__main__':run()
