import json
import copy
import datetime

with open('ws') as f:
    ws = json.load(f)

with open('sublist') as f:
    sublist = json.load(f)

with open('evaluations') as f:
    evals = json.load(f)

    # Special case 6.871 evals.
    # evals['6.871'] = evals['HST.956']

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
    classes[c]['lm'] = ws[c]['limited']
    classes[c]['t'] = ws[c]['terms']
    classes[c]['pr'] = ws[c]['prereq']
    classes[c]['d'] = ws[c]['desc']
    classes[c]['n'] = ws[c]['name']

    classes[c]['i'] = ws[c]['in-charge']
    classes[c]['v'] = all_virtual(ws[c]['l'] + ws[c]['r'] + ws[c]['b'])


    if c in sublist:
        classes[c]['nx'] = sublist[c]['no_next']
        classes[c]['hf'] = sublist[c]['half']
        classes[c]['rp'] = sublist[c]['repeat']
        classes[c]['u'] = sublist[c]['url']
        try:
            classes[c]['f'] = sublist[c]['final']
        except:
            print('failed to get final for', c)
            classes[c]['f'] = False
        if 'old_num' in sublist[c]:
            classes[c]['on'] = sublist[c]['old_num']
            classes[c]['n'] = "[" + sublist[c]['old_num'] + "] " + classes[c]['n']
    else:
        classes[c]['nx'] = False
        classes[c]['hf'] = False
        classes[c]['rp'] = False
        classes[c]['u'] = ''
        classes[c]['f'] = False

    old_c = classes[c].get('on', None)
    if c in evals or (old_c and old_c in evals):
        total_rating = 0
        total_hours = 0
        total_size = 0
        terms = 0
        
        evals_ = evals[old_c] if old_c else evals[c]
        for t in evals_:
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

# Special case 6.S977.
classes['6.S977']['u1'] = 3
classes['6.S977']['u2'] = 0
classes['6.S977']['u3'] = 9
classes['6.S977']['n'] = 'The Sum of Squares Methods'
classes['6.S977']['d'] = 'Study of algorithms and computational complexity through the lens of the Sum of Squares method (SoS), a powerful approach to algorithm design generalizing linear programming and spectral methods. Specific sub-topics vary and are chosen with student input, potentially including algorithms for combinatorial and continuous optimization (graphs, constraint satisfaction problems, unique games conjecture), applications to high-dimensional algorithmic statistics (robustness, privacy, method of moments), applications to quantum information, and an SoS perspective on computational complexity (of NP-hard problems and/or of statistical inference).'

classes['21M.707']['d'] = 'Explore performance and cultural production of Black intellectuals and artists on Broadway and in local communities. Engage with intersections of race, class, gender, sexuality, abilities, and social justice. Class discussions, diverse readings, creative assignments, live performances, exhibits, and guest artists enrich our study. Everyone is welcome. No prerequisites.'

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

classes['22.05']['l'] = [[[[33,3],[93,3]],"24-121"]]
classes['22.05']['r'] = [[[[124,2]],"24-121"]]

last_update = datetime.datetime.now().strftime('%Y-%m-%d %l:%M %p')

with open('full.js', 'w') as f:
    f.write('var last_update = "' + last_update + '";\n')
    f.write('var classes = ')
    json.dump(classes, f, separators=(',', ':'))
    f.write(';')

with open('full.json', 'w') as f:
    obj = {}
    obj["lastUpdated"] = last_update
    obj["classes"] = classes
    json.dump(obj, f, separators=(',', ':'))
