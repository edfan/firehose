import json
import copy

with open('csb') as f:
    times = json.load(f)

with open('sublist') as f:
    descs = json.load(f)

with open('evaluations') as f:
    evals = json.load(f)

classes = {}

for c in times:
    classes[c] = {
        'no': c,
        'co': times[c]['course'],
        'cl': times[c]['class'],
        'f': times[c]['final'],
        'tb': times[c]['tba'],
        
        's': times[c]['sections'],
        'l': times[c]['l'],
        'r': times[c]['r'],
        'b': times[c]['b'],
        'lr': times[c]['l_raw'],
        'rr': times[c]['r_raw'],
        'br': times[c]['b_raw']}

    if c in descs:
        classes[c]['hh'] = descs[c]['HASS-H']
        classes[c]['ha'] = descs[c]['HASS-A']
        classes[c]['hs'] = descs[c]['HASS-S']
        classes[c]['he'] = descs[c]['HASS-E']
        classes[c]['ci'] = descs[c]['CI-H']
        classes[c]['cw'] = descs[c]['CI-HW']
        classes[c]['nx'] = descs[c]['no_next']
        classes[c]['rp'] = descs[c]['repeat']
        classes[c]['re'] = descs[c]['REST']
        classes[c]['la'] = descs[c]['LAB']
        classes[c]['pl'] = descs[c]['pLAB']
        classes[c]['u1'] = descs[c]['units1']
        classes[c]['u2'] = descs[c]['units2']
        classes[c]['u3'] = descs[c]['units3']
        classes[c]['le'] = descs[c]['level']
        classes[c]['sa'] = descs[c]['same_as']
        classes[c]['mw'] = descs[c]['meets_with']
        classes[c]['u'] = descs[c]['url']
        classes[c]['t'] = descs[c]['terms']
        classes[c]['pr'] = descs[c]['prereq']
        classes[c]['d'] = descs[c]['desc']
        classes[c]['n'] = descs[c]['name']
    else:
        classes[c]['hh'] = False
        classes[c]['ha'] = False
        classes[c]['hs'] = False
        classes[c]['he'] = False
        classes[c]['ci'] = False
        classes[c]['cw'] = False
        classes[c]['rp'] = False
        classes[c]['re'] = False
        classes[c]['la'] = False
        classes[c]['pl'] = False
        classes[c]['u1'] = 0
        classes[c]['u2'] = 0
        classes[c]['u3'] = 0
        classes[c]['sa'] = ''
        classes[c]['mw'] = ''
        classes[c]['le'] = 'U'
        classes[c]['t'] = ['FA']
        classes[c]['pr'] = 'None'
        classes[c]['d'] = "This class is in the registrar's schedule, but not the course catalog."
        classes[c]['n'] = 'Special Subject'

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

try:
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
    print(e)

with open('full.json', 'w') as f:
    f.write('var classes = ')
    json.dump(classes, f, separators=(',', ':'))
    f.write(';')

        
        
        
