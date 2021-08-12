import json
import copy

with open('ws') as f:
    ws = json.load(f)

with open('sublist') as f:
    sublist = json.load(f)

with open('evaluations') as f:
    evals = json.load(f)

    # Special case 6.871 evals.
    evals['6.871'] = evals['HST.956']

classes = {}

def all_virtual(sections):
    for s in sections:
        if s[1] != 'Virtual':
            return False
    return True

for c in ws:
    classes[c] = {
        'no': c,
        'co': ws[c]['course'],
        'cl': ws[c]['class'],
        'tb': ws[c]['tba'],
        
        's': ws[c]['sections'],
        'l': ws[c]['l'],
        'r': ws[c]['r'],
        'b': ws[c]['b'],
        'lr': ws[c]['l_raw'],
        'rr': ws[c]['r_raw'],
        'br': ws[c]['b_raw']}

    classes[c]['hh'] = ws[c]['HASS-H']
    classes[c]['ha'] = ws[c]['HASS-A']
    classes[c]['hs'] = ws[c]['HASS-S']
    classes[c]['he'] = ws[c]['HASS-E']
    classes[c]['ci'] = ws[c]['CI-H']
    classes[c]['cw'] = ws[c]['CI-HW']
    classes[c]['re'] = ws[c]['REST']
    classes[c]['la'] = ws[c]['LAB']
    classes[c]['pl'] = ws[c]['pLAB']
    classes[c]['u1'] = ws[c]['units1']
    classes[c]['u2'] = ws[c]['units2']
    classes[c]['u3'] = ws[c]['units3']
    classes[c]['le'] = ws[c]['level']
    classes[c]['sa'] = ws[c]['same_as']
    classes[c]['mw'] = ws[c]['meets_with']
    classes[c]['t'] = ws[c]['terms']
    classes[c]['pr'] = ws[c]['prereq']
    classes[c]['d'] = ws[c]['desc']
    classes[c]['n'] = ws[c]['name']
    classes[c]['i'] = ws[c]['in-charge']
    classes[c]['v'] = all_virtual(ws[c]['l'] + ws[c]['r'] + ws[c]['b'])

    if c in sublist:
        classes[c]['nx'] = sublist[c]['no_next']
        classes[c]['rp'] = sublist[c]['repeat']
        classes[c]['u'] = sublist[c]['url']
        try:
            classes[c]['f'] = sublist[c]['final']
        except:
            print('failed to get final for', c)
            classes[c]['f'] = False
    else:
        classes[c]['nx'] = False
        classes[c]['rp'] = False
        classes[c]['u'] = ''
        classes[c]['f'] = False

    if c in evals:
        total_rating = 0
        total_hours = 0
        total_size = 0
        terms = 0
        
        for t in evals[c]:
            if t['resp'] > 0:
                total_rating += t['rating']
                total_hours += t['oc_hours'] + t['ic_hours']
                total_size += t['eligible']
                terms += 1
                
        if terms == 0:
            terms = 1
            
        classes[c]['ra'] = round(total_rating / terms, 1)
        classes[c]['h'] = round(total_hours / terms, 1)
        classes[c]['si'] = round(total_size / terms, 1)
    else:
        classes[c]['ra'] = 0
        classes[c]['h'] = 0
        classes[c]['si'] = 0

# Special case 2.008 schedule.
# classes['2.008']['s'] = ['l', 'b']
# classes['2.008']['r'] = []

""" try:
    # Special case 14.01/14.02 rec-only sections.
    classes['14.01R'] = copy.deepcopy(classes['14.01'])
    classes['14.01']['r'] = classes['14.01']['r'][:2]
    classes['14.01']['rr'] = classes['14.01']['rr'][:2]
    classes['14.01R']['no'] = '14.01R'
    classes['14.01R']['s'] = ['r']
    classes['14.01R']['r'] = classes['14.01R']['r'][2:]
    classes['14.01R']['rr'] = classes['14.01R']['rr'][2:]
    classes['14.01R']['n'] += " (recitation only)"
    del classes['14.01R']['l']


    classes['14.02R'] = copy.deepcopy(classes['14.02'])
    classes['14.02']['r'] = classes['14.02']['r'][:2]
    classes['14.02']['rr'] = classes['14.02']['rr'][:2]
    classes['14.02R']['no'] = '14.02R'
    classes['14.02R']['s'] = ['r']
    classes['14.02R']['r'] = classes['14.02R']['r'][2:]
    classes['14.02R']['rr'] = classes['14.02R']['rr'][2:]
    classes['14.02R']['n'] += " (recitation only)"
    del classes['14.02R']['l'] 


except Exception as e:
    print(e) """

with open('full.json', 'w') as f:
    f.write('var classes = ')
    json.dump(classes, f, separators=(',', ':'))
    f.write(';')

        
        
        
