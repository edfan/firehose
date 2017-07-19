import json
import copy
from functools import cmp_to_key

def class_sort_internal(a, b):
    if len(a) < len(b):
        return -1
    elif len(a) > len(b):
        return 1

    for i in range(len(a)):
        if a[i] < b[i]:
            return -1
        elif a[i] > b[i]:
            return 1
        
    return 0

def class_sort_internal2(a, b):
    if len(a) < len(b):
        mult = -1
        length = len(a)
    elif len(a) > len(b):
        mult = 1
        length = len(b)
    else:
        mult = 0
        length = len(a)

    for i in range(length):
        if a[i] < b[i]:
            return -1
        elif a[i] > b[i]:
            return 1

    return mult

def class_sort(a, b):
    a_s = a['u'].split('.')
    b_s = b['u'].split('.')

    sort = class_sort_internal(a_s[0], b_s[0])
    if sort == 0:
        sort = class_sort_internal2(a_s[1], b_s[1])
        
    return sort

with open('csb') as f:
    times = json.load(f)

with open('sublist') as f:
    descs = json.load(f)

with open('evaluations') as f:
    evals = json.load(f)

classes_base = []
classes_extended = []

"""
One-character mappings:

Base:
h: hours (decimal)
n: name (str)
r: rating (decimal)
s: sort (int)
u: number (str)

Extended:
a: same-as (str)
d: description (str)
f: flags (dict)
l: level ('U' || 'G')
m: meets-with (str)
n: units (int[3])
p: prereqs (str)
r: url (str)
s: sections (str[3])
t: terms (list)
u: number (str)
w: raw sections (str[3])
z: size (decimal)

Flags:
a: HASS-A
c: CI-H
e: HASS-E
f: final
h: HASS-H
l: Institute Lab
n: not offered next year
p: Partial Lab
r: REST
s: HASS-S
t: TBA section
u: repeat for credit
w: CI-HW
"""

for c in times:
    cl = {
        'u': c,
    }

    cl_e = {
        'u': c,
        'f': {},
        's': {},
        'w': {}
    }

    for s in times[c]['sections']:
        cl_e['s'][s] = times[c][s]
        cl_e['w'][s] = times[c][s + '_raw']

    if times[c]['final']:
        cl_e['f']['f'] = 0
    if times[c]['tba']:
        cl_e['f']['t'] = 0

    if c in descs:
        cl['n'] = descs[c]['name']
        cl_e['d'] = descs[c]['desc']

        if descs[c]['HASS-H']:
            cl_e['f']['h'] = 0
        if descs[c]['HASS-A']:
            cl_e['f']['a'] = 0
        if descs[c]['HASS-S']:
            cl_e['f']['s'] = 0
        if descs[c]['HASS-E']:
            cl_e['f']['e'] = 0
        if descs[c]['CI-H']:
            cl_e['f']['c'] = 0
        if descs[c]['CI-HW']:
            cl_e['f']['w'] = 0
        if descs[c]['no_next']:
            cl_e['f']['n'] = 0
        if descs[c]['repeat']:
            cl_e['f']['u'] = 0
        if descs[c]['REST']:
            cl_e['f']['r'] = 0
        if descs[c]['LAB']:
            cl_e['f']['l'] = 0
        if descs[c]['pLAB']:
            cl_e['f']['p'] = 0

        cl_e['n'] = [descs[c]['units1'], descs[c]['units2'], descs[c]['units3']]
        cl_e['l'] = descs[c]['level']
        cl_e['t'] = descs[c]['terms']
        cl_e['r'] = descs[c]['url']
        cl_e['m'] = descs[c]['meets_with']
        cl_e['a'] = descs[c]['same_as']
        cl_e['p'] = descs[c]['prereq']
    else:
        cl['n'] = 'Special Subject'
        cl['d'] = "This class is in the registrar's schedule, but not the course catalog."
        
        cl_e['n'] = [0, 0, 0]
        cl_e['l'] = 'U'
        cl_e['t'] = ['FA']
        cl_e['r'] = ''
        cl_e['m'] = ''
        cl_e['a'] = ''
        cl_e['p'] = ''

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
            
        cl['r'] = round(total_rating / terms, 1)
        cl['h'] = round(total_hours / terms, 1)
        cl_e['z'] = round(total_size / terms, 1)
    else:
        cl['r'] = 0
        cl['h'] = 0
        cl_e['z'] = 0

    classes_base.append(cl)
    classes_extended.append(cl_e)

# Special case 14.01/14.02 rec-only sections.
index = next(index for (index, d) in enumerate(classes_base) if d['u'] == '14.01')
temp_base = copy.deepcopy(classes_base[index])
temp_extended = copy.deepcopy(classes_extended[index])
classes_extended[index]['s']['r'] = temp_extended['s']['r'][:5]
temp_base['u'] = '14.01R'
temp_extended['u'] = '14.01R'
temp_extended['s'] = { 'r': temp_extended['s']['r'][5:] }
temp_base['n'] += " (recitation only)"
classes_base.insert(index + 1, temp_base)
classes_extended.insert(index + 1, temp_extended)

index = next(index for (index, d) in enumerate(classes_base) if d['u'] == '14.02')
temp_base = copy.deepcopy(classes_base[index])
temp_extended = copy.deepcopy(classes_extended[index])
classes_extended[index]['s']['r'] = temp_extended['s']['r'][:2]
temp_base['u'] = '14.01R'
temp_extended['u'] = '14.01R'
temp_extended['s'] = { 'r': temp_extended['s']['r'][2:] }
temp_base['n'] += " (recitation only)"
classes_base.insert(index + 1, temp_base)
classes_extended.insert(index + 1, temp_extended)

# Calculate a sorting order.
classes_base.sort(key=cmp_to_key(class_sort))
for i in range(len(classes_base)):
    classes_base[i]['s'] = i

# Convert to dict.
classes_base_d = {}
classes_extended_d = {}

for c in classes_base:
    classes_base_d[c['u']] = c
for c in classes_extended:
    classes_extended_d[c['u']] = c

with open('classes_base.json', 'w') as f:
    f.write('var classes = ')
    json.dump(classes_base_d, f, separators=(',', ':'))
    f.write(';')

with open('classes_extended.json', 'w') as f:
    json.dump(classes_extended_d, f, separators=(',', ':'))
