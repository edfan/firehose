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
    classes['14.01']['r'] = classes['14.01']['r'][:3] + [classes['14.01']['r'][5]]
    classes['14.01']['rr'] = classes['14.01']['rr'][:3] + [classes['14.01']['rr'][5]]
    classes['14.01R']['no'] = '14.01R'
    classes['14.01R']['s'] = ['r']
    classes['14.01R']['r'] = classes['14.01R']['r'][3:5]
    classes['14.01R']['rr'] = classes['14.01R']['rr'][3:5]
    classes['14.01R']['n'] += " (recitation only)"
    del classes['14.01R']['l']

    # Special case 16.001/16.003 evals.
    #classes['16.001']['h'] = 11.6

    # Special case 18.01A description.
    #classes['18.01A']['d'] = "Six-week review of one-variable calculus, emphasizing material not on the high-school AB syllabus: integration techniques and applications, improper integrals, infinite series, applications to other topics, such as probability and statistics, as time permits. Prerequisites: one year of high-school calculus or the equivalent, with a score of 5 on the AB Calculus test (or the AB portion of the BC test, or an equivalent score on a standard international exam), or equivalent college transfer credit, or a passing grade on the first half of the 18.01 advanced standing exam. "

    # Special case 2.S991 description.
    classes['2.S991']['n'] = "Designing the First Year at MIT"
    classes['2.S991']['d'] = "This subject will offer instruction in the process of design while working on a specific design challenge: the potential to significantly improve and innovate on the MIT undergraduate first year. Using design methods from across MIT Schools, students will learn about the design process beginning with identifying needs and goals to developing concepts and modes of validation. Beginning with stakeholder needs identification that will involve reaching out directly to the MIT community, students will be responsible for project deliverables including a customer needs document and a tradespace of options. Subject work will be team-based and project-focused, offering students an opportunity to present the audacious and incremental options developed to senior MIT stakeholders in a workshop format. Students will also be exposed to principles of curriculum design and pedagogy, as they develop a holistic perspective to the design of the MIT First Year."
    classes['2.S991']['u1'] = 3
    classes['2.S991']['u3'] = 9
    classes['2.S991']['he'] = True

    # Special case 6.08 / 6.S08.
    classes['6.08']['ra'] = 6.6
    classes['6.08']['h'] = 12.3
    classes['6.08']['si'] = 109.5
except:
    pass

with open('full.json', 'w') as f:
    f.write('var classes = ')
    json.dump(classes, f, separators=(',', ':'))
    f.write(';')

        
        
        
