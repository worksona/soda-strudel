"""Curate soda.strudel collections from the repertoire catalogue, the research candidates,
the licensed originals and soda's own examples. Output: project-state/documents/repertoire/collections.json.
Policy (decision 2026-11-01-repertoire-reuse-policy): items with an open licence get a `load` (the app
fetches the code from its source when a person clicks – nothing is copied here); everything else links."""
import json, yaml, glob, re, urllib.parse
ROOT='/Users/davidolsson/Documents/soda-strudel'; PS=f'{ROOT}/project-state'
cat=json.load(open(f'{PS}/documents/repertoire/catalogue.json'))
cands={}
for f in glob.glob(f'{PS}/research/candidates/RES-L-*.yaml'):
    c=yaml.safe_load(open(f)); cands[c['id']]=c
ex_titles=re.findall(r"title: '([^']+)'",open(f'{ROOT}/src/examples.js').read())
TUNES='https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/tunes.mjs'
TUNES_RAW='https://codeberg.org/uzu/strudel/raw/branch/main/website/src/repl/tunes.mjs'
AWESOME_RAW='https://raw.githubusercontent.com/terryds/awesome-strudel/main/README.md'
OPEN={'CC-BY-SA-4.0':'CC BY-SA 4.0','CC-BY-NC-SA-4.0':'CC BY-NC-SA 4.0','CC-BY-NC-SA':'CC BY-NC-SA','MIT':'MIT','AGPL-3.0':'AGPL-3.0','CC0':'CC0','Unlicense':'Unlicense'}
def raw(u):
    m=re.match(r'https://github\.com/([^/]+/[^/]+)/blob/(.+)$',u)
    if m: return f'https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}'
    m=re.match(r'https://codeberg\.org/([^/]+/[^/]+)/src/(.+)$',u)
    if m: return f'https://codeberg.org/{m.group(1)}/raw/{m.group(2)}'
    return None
def song(title_start, by=None):
    s=next(s for s in cat['songs'] if s['title'].startswith(title_start) and (not by or by in s['author']))
    reuse='adapt' if s['reuse'].startswith('adapt') else 'link' if s['reuse'].startswith('link-only (comp') else 'ask'
    url=s['url'] if s['url'].startswith('http') and '…' not in s['url'] else next((x['url'] for x in s.get('sources',[]) if x.get('url')),None) or 'https://github.com/terryds/awesome-strudel#-featured-tracks'
    it=dict(kind='video' if 'youtu' in url else 'song',title=s['title'],by=s['author'],original=s.get('original_artist') if s.get('original_artist') and 'not named' not in s['original_artist'] and 'appears' not in s['original_artist'] else None,
            genre=s['genre'],date=s['date'] if re.match(r'\d{4}-',str(s.get('date',''))) else None,license=s['script_license'],reuse=reuse,url=url,note=s.get('learn') or s['description'],ref=s['id'])
    if s.get('share')=='code embedded in the link':
        it.update(reuse='public',load=dict(url=AWESOME_RAW,track=s['title']),source='https://github.com/terryds/awesome-strudel#-featured-tracks')
    m=re.search(r'tunes\.mjs#L(\d+)',s['url'])
    if m and s['script_license'].startswith('CC BY-NC-SA'):
        name={'Caverave':'caverave','Amensister':'amensister','Belldub':'belldub','Flatrave':'flatrave','Bass fuge':'bassFuge','Random bells':'randomBells','Dinofunk':'dinofunk','Lounge sponge':'loungeSponge'}[s['title']]
        it.update(reuse='open',license='CC BY-NC-SA 4.0',load=dict(url=TUNES_RAW,export=name),source=TUNES)
    return it
def cand(cid, note=None):
    c=cands[cid]; p=c['profile']
    kind={'tutorial':'lesson','performance':'video','stream':'video','talk':'video','resource':'lesson','tool':'tool','samples':'bank','event':'event'}.get(p.get('kind'),'song')
    lic=p.get('license') or 'none stated'
    it=dict(kind=kind,title=c['name'],by=p.get('author'),genre=(p.get('genre') or '').replace(' (inferred)','') or None,level=p.get('level'),date=p.get('date'),
            license='YouTube standard licence' if 'youtu' in p.get('url','') else lic,reuse='link',url=p['url'],note=note or p.get('note'),ref=cid)
    if kind=='song' and p.get('url','').startswith('http'):
        key=next((k for k in OPEN if lic.upper().startswith(k.upper())),None)
        if key and 'NC-NA' not in lic and 'informal' not in lic:
            r=raw(p['url'])
            if r: it.update(reuse='open',license=OPEN[key],load=dict(url=r),source=p['url'])
        else:
            r=raw(p['url'])
            if r and 'pastagang' not in r: it.update(reuse='public',load=dict(url=r),source=p['url'])
            elif lic=='none stated' or lic.startswith('none'): it['reuse']='ask'
    return it
def find(sub, kind=None):
    for cid,c in sorted(cands.items()):
        p=c['profile']
        if (sub.lower() in c['name'].lower() or sub in p.get('url','')) and (not kind or p.get('kind')==kind): return cid
    raise KeyError(sub)
def res(title_start):
    r=next(r for r in cat['resources'] if r['title'].startswith(title_start))
    return dict(kind='tool' if r['type'] in ('tool','repository') else 'lesson',title=r['title'],by=r.get('author') or None,level=r['level'],license=r['license'],reuse='link',url=r['url'],note=r['description'],ref=r['id'])
def bank(title):
    b=next(b for b in cat['sound_banks'] if b['title']==title)
    it=dict(kind='bank',title=b['title'],by=b['author'],license=b['license'],reuse='open' if b['reuse'].startswith('usable') else 'link',url=b['url'],note=(b.get('credit_line') or b['description'])[:200],ref=b['id'])
    TRY={'AuditeMarlow/samples':'$: s("marlow_kick marlow_hihat marlow_snare marlow_hihat")\n','fstiffo/polifonia-samples':'$: n("<0 2 4 7>").s("italy").room(.6).slow(2)\n','hvillase/cavlp-25p':'$: s("botella pelota*2 spray pelota").gain(.7)\n'}
    if b['reuse'].startswith('usable') and b['title'] in TRY: it['try']=TRY[b['title']]; it['note']=(it.get('note') or '')+' – loads with soda: no samples() line needed.'
    return it
def example(title, note):
    assert title in ex_titles, title
    return dict(kind='example',title=title,by='soda.strudel',license='AGPL-3.0',reuse='open',example=title,note=note)

C=[]
def coll(id,title,blurb,level,items): C.append(dict(id=id,title=title,blurb=blurb,level=level,items=[i for i in items if i]))

coll('start-here','Start here: learn Strudel','First steps, in order: the official workshop, then short from-scratch videos, then a finished piece to take apart.','first steps',[
  res('Official Strudel Guide'), example('First light','soda.strudel\'s own opener: how arrange() builds a song, with pictures on the same plan.'),
  cand(find('Live Coding For Music With Strudel.cc (Beginners)')) if any('Live Coding For Music With Strudel.cc (Beginners)' in c['name'] for c in cands.values()) else res('Live Coding For Music With Strudel.cc'),
  res('Creative Code Art - WORKSHOP'), cand(find('Strudel Live Coding #1: Starting Out')), cand(find('Creating Beats & Rhythms in STRUDEL')),
  cand(find('#23 Basics of Pattern and Cycle')), res('Learning Music Production with Strudel'), res('Intro To Algorave'), res('Learn how to make music through live coding')])
coll('open-to-play','Open licence: play them here','Pieces whose authors chose an open licence – they open straight into the editor, with the credit at the top.','all',[
  cand(find('from-scratch (session 2026-08-26)')), cand(find('Fail-safe')), cand(find('Ossuary')), cand(find('Low Tide Radio')), cand(find('ambient-experiment')),
  cand(find('Song Sanctuary theme')), cand(find('Guarded Stones')), cand(find('Saudade')), cand(find('Fio')), cand(find('Corporate')),
  song('Caverave'), song('Belldub'), song('Random bells')])
coll('strudel-classics','Strudel classics by Felix Roos','The tunes that ship with Strudel, by its co-author – CC BY-NC-SA 4.0, so they open here with credit.','intermediate',[
  song(t) for t in ('Caverave','Amensister','Belldub','Flatrave','Bass fuge','Random bells','Dinofunk','Lounge sponge')])
coll('techno-house','Techno and house','Four-on-the-floor, from first groove to dub chords and acid lines.','all',[
  cand(find('Coding a HOUSE Groove in Strudel')), cand(find('Coding Minimal Techno in Strudel')), cand(find('Coding DETROIT TECHNO')), song('Strudel coding house music'),
  song('Strudel Live Coding #39: Dark Dub Techno'), song('2 Minute Deep Acid'), cand(find('#41: Filter Envelope for Acid Techno')), cand(find('from-scratch (session 2026-08-26)')),
  cand(find('Fail-safe')), cand(find('germantechno3')), song('Caverave'), song('Flatrave'), example('Dub techno fog','soda\'s dub techno, after Breath of Strudel.'), example('Minimal techno 130','soda example after live-coding-music-mcp.')])
coll('bass-and-breaks','Drum & bass, jungle and breaks','Chopping breaks, rolling basslines and the Amen – from first slice to liquid DnB.','all',[
  cand(find('Break Chopping & Mini Notation')), cand(find('Chopping Breaks & Samples in STRUDEL')), cand(find('Coding JUNGLE in Strudel')), song('Coding DRUM and BASS'),
  song('Livecoding melodic DNB'), song('Amen break SPEEDRUN'), song('Chopping jungle breaks'), cand(find('Ossuary')), cand(find('Low Tide Radio')),
  cand(find('Deep Meditation')), cand(find('jungle-gym')), cand(find('footwork',kind='song')), song('Amensister'), example('Drum & bass 174','soda example after live-coding-music-mcp.')])
coll('ambient-generative','Ambient and generative','Slow pads, chance and process – music that plays itself.','all',[
  song('Coding AMBIENT Music'), cand(find('Coding Music for Cold Machines')), song('Random bells'), cand(find('ambient-experiment')), cand(find('Fio')),
  cand(find('atmos')), cand(find('ambient 251003')), song('you will not steve reich'), cand(find('let code die')), example('Ambient drone','soda example after live-coding-music-mcp.')])
coll('game-and-chiptune','Game music and chiptune','Square, triangle and noise – the sound of consoles, plus music written for an open-source game.','all',[
  cand(find('Coding 8-BIT Game Music')), cand(find('Song Sanctuary theme')), cand(find('Guarded Stones')), cand(find('Corporate')),
  song('Super mario bros'), song("Kraid's Lair"), song('Lavender Town'), song('Mt. Moon'), song('Goldenrod City'), song('Vegetable Valley'), song('Determination'), song('Toby Fox - Megalovania','tzwaan')])
coll('hiphop-and-lofi','Hip-hop and lo-fi','Swing, dusty keys and laid-back drums.','all',[
  song('Coding a Lo-fi Hip Hop Beat'), cand(find('What makes music sound LO-FI')), cand(find('Coding a TRAP Beat')), cand(find('lofi-1')), cand(find('hiphop strudel beat')), song('Gorillaz – Feel Good Inc')])
coll('synthwave-trance-and-more','Synthwave, trance and more styles','One-genre-at-a-time studies: synthwave, trance, disco, UK garage, dubstep, hardstyle.','first steps',[
  cand(find('Coding Synthwave in Strudel')), cand(find('How DARKSYNTH is made')), song('Coding Trance Music'), cand(find('Coding a TRANCE Build-Up')),
  cand(find('Coding a DISCO groove')), cand(find('What makes UK GARAGE')), cand(find('Coding a Dubstep WOBBLE')), cand(find('Coding a HARDSTYLE kick')), example('Trance lift','soda trance in four chapters.')])
coll('covers-and-transcriptions','Covers and transcriptions','Well-known songs rebuilt as patterns – the best way to see how a real arrangement is laid out. Listen at the source: the songs belong to their composers.','intermediate',[
  song('New Order - Blue Monday'), song('Radiohead – Pyramid Song'), song('Radiohead - Everything'), song('Gorillaz – Feel Good Inc'), song('Joseph Haydn'),
  song('Dmitri Shostakovich'), song('Giant Steps'), song('Enjoy The Silence'), song('Super mario bros'), song('Only for the DMG 101'), song('Birds of a Feather')])
coll('music-theory','Music theory in code','Short videos where one change – a mode, an extra note, a progression – explains why music sounds the way it does.','intermediate',[
  cand(find('One word changes the whole mood')), cand(find('Why does Lydian')), cand(find('Why does the blues sound')), cand(find('harmonic minor')),
  cand(find('circle of')) if any('circle of' in c['name'] for c in cands.values()) else cand(find('chord progression feel')), cand(find('Why does this sound SPANISH')), cand(find('POLYRHYTHM 3 against 4')),
  cand(find('How I make a BORING melody')), example('Three against four against five','soda\'s polyrhythm study.')])
coll('performances','Performances','Strudel on stage and on stream – from the Showcase and algorave nights.','performer',[
  cand(find('yaxu & olivia')), cand(find('froos @ Algorave 10th')), cand(find('Jade Rose - Into your spell')), cand(find('Livecode and vocal breaks by Switch Angel')),
  cand(find('Eddyflux algorave set')), cand(find('Djenerative Music')), cand(find('Emma Osman @ (Algo|Afro)')), cand(find('Tomilola Olumide')), song('dough dream #1'), song('DJ_Dave – Array'), cand(find('froos @ WAC 2022'))])
coll('sounds-and-tools','Sounds and tools','Sample banks cleared for use, and tools that turn MIDI, humming or a song into Strudel code.','all',[
  bank('AuditeMarlow/samples'), bank('fstiffo/polifonia-samples'), bank('hvillase/cavlp-25p'), res('strudel samples'),
  res('Melograph'), res('MIDI to Strudel'), res('midi-strudel'), res('Toaster'), res('PLAYER'), res('Strudel Neovim Controller')])
harv=json.load(open(f'{PS}/documents/inbox/harvest-2026-11-01-song-repos.json'))
by_url={c['profile'].get('url'):cid for cid,c in cands.items()}
def repo_items(repo_sub):
    out=[]
    for i in harv['items']:
        if repo_sub not in i['repo']: continue
        cid=by_url.get(i['url'])
        if cid: it=cand(cid)
        else:
            it=dict(kind='song',title=i['title'],by=i.get('author'),license='none stated',reuse='public',url=i['url'],load=dict(url=raw(i['url'])),source=i['url'])
        it['original']=i.get('original_artist'); it['genre']=(i.get('genre') or '').replace(' (inferred)','').replace('inferred: ','') or None
        it['date']=i.get('date'); it['note']=i.get('note') or it.get('note')
        it['kind']='song'
        out.append(it)
    return out
coll('eefano-songbook','eefano\'s songbook','93 songs by eefano – covers of Cardiacs, Tim Smith, The Sea Nymphs and more, plus originals and jam sessions. They open here unchanged, credited; the songs belong to their writers.','intermediate',repo_items('eefano'))
coll('community-originals','Community originals','Original Strudel pieces shared by their authors across techno, drum & bass, dub, ambient, glitch, world and game music. Licensed ones may be reused; the rest open here unchanged – ask the author before reusing.','all',
     [cand(cid) for cid,c in sorted(cands.items()) if c['profile'].get('kind') in (None,'song') and c['profile'].get('platform') in (None,'') and c['profile'].get('url','').startswith('http')])
for c in C:
    if c['id']=='covers-and-transcriptions': c['items']+=repo_items('aria')

# de-duplicate within a collection, count
for c in C:
    seen=set(); items=[]
    for it in c['items']:
        k=it.get('ref') or it.get('url') or it.get('example')
        if k in seen: continue
        seen.add(k); items.append({k:v for k,v in it.items() if v not in (None,'')})
    c['items']=items
out=dict(version=1,updated='2026-11-01',source='project-state RES-M-001 (catalogue + first harvest)',policy='decision 2026-11-01-repertoire-reuse-policy',collections=C)
json.dump(out,open(f'{PS}/documents/repertoire/collections.json','w'),indent=1,ensure_ascii=False)
for c in C: print(c['id'].ljust(26),len(c['items']),'items,',sum(1 for i in c['items'] if i.get('load')),'loadable,',sum(1 for i in c['items'] if i.get('example')),'examples,',sum(1 for i in c['items'] if i.get('samples')),'banks')
print('loadable pieces:',len({i['load']['url']+i['load'].get('export','') for c in C for i in c['items'] if i.get('load')}))
