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
    a_s = a['number'].split('.')
    b_s = b['number'].split('.')

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

classes = []

for c in times:
    cl = {
        'number': c,
    }

    if c in descs:
        cl['name'] = descs[c]['name']
        cl['description'] = descs[c]['desc']
    else:
        cl['name'] = 'Special Subject'
        cl['description'] = "This class is in the registrar's schedule, but not the course catalog."

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
            
        cl['rating'] = round(total_rating / terms, 1)
        cl['hours'] = round(total_hours / terms, 1)
    else:
        cl['rating'] = 0
        cl['hours'] = 0

    classes.append(cl)

# Calculate a sorting order.
classes.sort(key=cmp_to_key(class_sort))
for i in range(len(classes)):
    classes[i]['sort'] = i

with open('mongo_import.json', 'w') as f:
    json.dump(classes, f)
