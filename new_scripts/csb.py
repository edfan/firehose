import string
import itertools
import json

timeslots = 30
days = {'M': 0,
        'T': timeslots,
        'W': timeslots * 2,
        'R': timeslots * 3,
        'F': timeslots * 4}
times = {'8': 0,
         '8.30': 1,
         '9': 2,
         '9.30': 3,
         '10': 4,
         '10.30': 5,
         '11': 6,
         '11.30': 7,
         '12': 8,
         '12.30': 9,
         '1': 10,
         '1.30': 11,
         '2': 12,
         '2.30': 13,
         '3': 14,
         '3.30': 15,
         '4': 16,
         '4.30': 17,
         '5': 18,
         '5.30': 19,
         '6': 20,
         '6.30': 21,
         '7': 22,
         '7.30': 23}

eve_times = {'1': 10,
             '1.30': 11,
             '2': 12,
             '2.30': 13,
             '3': 14,
             '3.30': 15,
             '4': 16,
             '4.30': 17,
             '5': 18,
             '5.30': 19,
             '6': 20,
             '6.30': 21,
             '7': 22,
             '7.30': 23,
             '8': 24,
             '8.30': 25,
             '9': 26,
             '9.30': 27,
             '10': 28,
             '10.30': 29}

def tsp_eve(t):
    wdays = t.split()[0]
    t = t[t.find("(")+1:t.find(")")].rstrip(' PM')
    
    slots = []
    startendtime = t.split('-')
    try:
        for d in wdays:
            if len(startendtime) > 1:
                length = eve_times[startendtime[1]] - times[startendtime[0]]
            else:
                length = 2
            slots.append((days[d] + eve_times[startendtime[0]], length))
    except Exception:
        print(t)

    return slots

def tsp(t):
    if '*' in t:
        return []
    
    if 'EVE' in t:
        return tsp_eve(t)

    t = t.split()[0]
    slots = []
    
    try:
        for t in t.split(','):

            split = [''.join(x) for _, x in itertools.groupby(t, key=str.isalpha)]
            startendtime = split[1].split('-')

            for d in split[0]:
                if len(startendtime) > 1:
                    length = times[startendtime[1]] - times[startendtime[0]]
                else:
                    length = 2
                slots.append((days[d] + times[startendtime[0]], length))
    except Exception:
        print(t)

    return slots

f = open('csb_raw')

current_class = ''
classes = {}

f.readline()

for line in f:
    c = line.replace('"', '').split('\t')
    c = [x.strip() for x in c]

    # Check that this line is actually a class.
    try:
        if not c[0][0].isalnum() or len(c) < 3:
            continue
    except:
        print(c)
        continue

    # Check that the class hasn't been cancelled.
    if "SUBJECT CANCELLED" in c[3]:
        continue

    # Initialize class object.
    if c[0] not in classes:
        classes[c[0]] = {'number': c[0],
                         'course': c[0].split('.')[0],
                         'class': c[0].split('.')[1],
                         'sections': [],
                         'l': [],
                         'r': [],
                         'b': [],
                         'l_raw': [],
                         'r_raw': [],
                         'b_raw': [],
                         'final': False,
                         'tba': False,
                         'all_slots': []}

    # Throw out MS/NS because their times are weird.
    if c[0][:2] in ['MS', 'NS']:
        continue

    # Check for finals.
    if c[1] == 'Q01':
        classes[c[0]]['final'] = True
        continue

    # Check for TBA.
    if c[3] == '*TO BE ARRANGED\n':
        classes[c[0]]['tba'] = True
        continue

    # Throw out comments.
    if c[1][0] == '0':
        continue
    
    # Parse timeslot.
    # Format: 30 timeslots a day.
    slots = []
    for s in c[3].strip().split(','):
        slots.extend(tsp(s))

    # If no slots, ignore.
    if slots == []:
        continue

    # If duplicate slot, throw out.
    if slots in classes[c[0]]['all_slots']:
        continue
    else:
        classes[c[0]]['all_slots'].append(slots)

    slots = (slots, c[2])

    if c[1][0] == 'L':
        if 'l' not in classes[c[0]]['sections']:
            classes[c[0]]['sections'].append('l')
        classes[c[0]]['l'].append(slots)
        classes[c[0]]['l_raw'].append(c[3].strip())
    elif c[1][0] == 'R':
        if 'r' not in classes[c[0]]['sections']:
            classes[c[0]]['sections'].append('r')
        classes[c[0]]['r'].append(slots)
        classes[c[0]]['r_raw'].append(c[3].strip())
    else:
        if 'b' not in classes[c[0]]['sections']:
            classes[c[0]]['sections'].append('b')
        classes[c[0]]['b'].append(slots)
        classes[c[0]]['b_raw'].append(c[3].strip())

with open('csb', 'w') as f:
    json.dump(classes, f)

with open('all_classes', 'w') as f:
    json.dump(list(classes.keys()), f)
    
