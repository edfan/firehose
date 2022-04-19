import json
import requests
import itertools

term = '2022SP'

# copied from csb.py

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

eve_times = {'12': 8,
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
             '7.30': 23,
             '8': 24,
             '8.30': 25,
             '9': 26,
             '9.30': 27,
             '10': 28,
             '10.30': 29}

def tsp_eve(t, number):
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
    except Exception as e:
        print("tsp_eve", e, t, number)

    return slots

def tsp(t, number):
    if '*' in t:
        return []
    
    if 'EVE' in t:
        return tsp_eve(t, number)
    
    slots = []
    try:
        t = t.split()[0]
        # remove trailing parens e.g. MWF2(LIMITEDTO15)
        t = t.split("(")[0]

        for t in t.split(','):

            split = [''.join(x) for _, x in itertools.groupby(t, key=str.isalpha)]
            startendtime = split[1].split('-')

            for d in split[0]:
                if len(startendtime) > 1:
                    length = times[startendtime[1]] - times[startendtime[0]]
                else:
                    length = 2
                slots.append((days[d] + times[startendtime[0]], length))
    except Exception as e:
        print("tsp", e, t, number)

    return slots

url = f'http://coursews.mit.edu/coursews/?term={term}'

raw_text = requests.get(url).text
# hilariously, the json is invalid thanks to one class
fixed_text = raw_text.replace('"Making"', '&quot;Making&quot;')
raw_classes = json.loads(fixed_text)['items']
classes = {}

terms = {'Fall': 'FA', 'IAP': 'JA', 'Spring': 'SP', 'Summer': 'SU'}

def term_map(semesters):
    return [terms[s] for s in semesters]

def parse_units(units):
    u = units.split('-')
    return u[0], u[1], u[2]

gir_rewrite = {
    'GIR:CAL1': 'Calculus I (GIR)',
    'GIR:CAL2': 'Calculus II (GIR)',
    'GIR:PHY1': 'Physics I (GIR)',
    'GIR:PHY2': 'Physics II (GIR)',
    'GIR:CHEM': 'Chemistry (GIR)',
    'GIR:BIOL': 'Biology (GIR)',
}

def parse_prereqs(prereqs):
    if len(prereqs) == 0:
        return 'None'
    for gir, gir_rw in gir_rewrite.items():
        prereqs = prereqs.replace(gir, gir_rw)
    return prereqs

def parse_joint(joint):
    return ', '.join([j.rstrip('J') for j in joint])

instructors = 'fall_instructors' if term[-2:] == 'FA' else 'spring_instructors'

with open("course_six_renumbering.json") as f:
    course_six_renumbering = json.loads(f.read())

for c in raw_classes:
    if c['type'] == 'Class':
        number = c['id']
        name = c['label']

        if number in course_six_renumbering:
            name = "[" + course_six_renumbering[number] + "] " + name

        units1, units2, units3 = parse_units(c['units'])

        classes[number] = {
            'number': number,
            'name':name,
            'course': number.split('.')[0],
            'class': number.split('.')[1],
            'sections': [],
            'l': [],
            'r': [],
            'b': [],
            'l_raw': [],
            'r_raw': [],
            'b_raw': [],
            'tba': False,
            'all_slots': [],
            'level': ('U' if c['level'] == 'Undergraduate' else 'G'),
            'terms': term_map(c['semester']),
            'desc': c['description'],
            'units1': int(units1),    
            'units2': int(units2),
            'units3': int(units3),
            'total_units': int(c['total-units']),
            'REST': c['gir_attribute'] == 'REST',
            'LAB': c['gir_attribute'] == 'LAB',
            'pLAB': c['gir_attribute'] == 'LAB2',
            'CI-H': c['comm_req_attribute'] == 'CIH',
            'CI-HW': c['comm_req_attribute'] == 'CIHW',
            'CI-M': c['comm_req_attribute'] == 'CIM',
            'HASS-H': 'HH' in c['hass_attribute'],
            'HASS-A': 'HA' in c['hass_attribute'],
            'HASS-S': 'HS' in c['hass_attribute'],
            'HASS-E': 'HE' in c['hass_attribute'],
            'prereq': parse_prereqs(c['prereqs']),
            'same_as': parse_joint(c['joint_subjects']),
            'meets_with': parse_joint(c['meets_with_subjects']),
            'sat': False,
            'limited': 'limited' in c['description'].lower(),
            # 'instructors': ', '.join(c[instructors]),
            'in-charge': c['in-charge']}

for c in raw_classes:
    if c['type'] == 'Class':
        continue
    elif c['type'] == 'LectureSession':
        typ = 'l'
        typraw = 'l_raw'
    elif c['type'] == 'RecitationSession':
        typ = 'r'
        typraw = 'r_raw'
    elif c['type'] == 'LabSession':
        typ = 'b'
        typraw = 'b_raw'
    else:
        print("unknown type", c)
        continue
    
    number = c['section-of']

    if number not in classes:
        print('section for nonexistent class', number)
        continue

    # manual fix: 21G.612
    if number == "21G.612":
        c['timeAndPlace'] = "MTRF 16-668"

    cl = classes[number]

    if 'EVE' in c['timeAndPlace']:
        split = c['timeAndPlace'].rsplit(' ', 1)
        t = split[0]
    else:
        # For some reason, a couple classes are totally inconsistent.
        tp = c['timeAndPlace']
        if "33-014, " in tp:
            tp = tp[:-5]
        if ":00" in tp or ":30" in tp:
            tp = tp.replace(":00", "").replace(":30", ".30")
        split = tp.rsplit(' ', 1)
        t = split[0].replace(' ', '')

    if 'ENDS' in t:
        t = t.split('(')[0].strip()

    p = split[1]

    if p == 'VIRTUAL':
        p = 'Virtual'

    # Check for TBA.
    if t == '*TO BE ARRANGED' or t == 'null' or t.lower() == 'tbd' or t.lower() == 'tba':
        cl['tba'] = True
        continue

    # Check for Saturday :(
    if 'S' in t:
        cl['sat'] = True
        continue
    
    # Parse timeslot.
    # Format: 30 timeslots a day.
    slots = []
    for s in t.strip().split(','):
        slots.extend(tsp(s, number))

    # If no slots, ignore.
    if slots == []:
        continue

    # If duplicate slot, throw out.
    if slots in cl['all_slots']:
        continue
    else:
        cl['all_slots'].append(slots)

    slots = (slots, p)

    if typ not in cl['sections']:
        cl['sections'].append(typ)

    cl[typ].append(slots)
    cl[typraw].append(t)

with open('ws', 'w') as f:
    json.dump(classes, f)

with open('all_classes', 'w') as f:
    json.dump(list(classes.keys()), f)
