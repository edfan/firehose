import json
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
u: number
n: name
r: rating
h: hours
s: sort

Extended:
d: description
"""

for c in times:
    cl = {
        'u': c,
    }

    cl_e = {
        'u': c,
    }

    if c in descs:
        cl['n'] = descs[c]['name']
        cl_e['d'] = descs[c]['desc']
    else:
        cl['n'] = 'Special Subject'
        cl['d'] = "This class is in the registrar's schedule, but not the course catalog."

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
    else:
        cl['r'] = 0
        cl['h'] = 0

    classes_base.append(cl)
    classes_extended.append(cl_e)

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
